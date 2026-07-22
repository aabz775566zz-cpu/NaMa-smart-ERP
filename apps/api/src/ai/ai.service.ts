import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AIPendingActionResult, PaymentMethod, PermissionKey } from '@erp-smart/types';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { AiToolRegistryService } from './ai-tool-registry.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { LLM_PROVIDER, LlmMessage, LlmProvider } from './llm/llm-provider.interface';

const MAX_TOOL_ITERATIONS = 3;

interface ToolCallRecord {
  name: string;
  arguments: unknown;
  success: boolean;
  error?: string;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

@Injectable()
export class AiService {
  constructor(
    private readonly tenantPrisma: TenantGuardedPrismaService,
    private readonly toolRegistry: AiToolRegistryService,
    private readonly paymentsService: PaymentsService,
    @Inject(LLM_PROVIDER) private readonly llmProvider: LlmProvider,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async chat(companyId: string, userId: string, userPermissions: PermissionKey[], dto: SendChatMessageDto) {
    // Ownership/existence errors here are client input errors (bad
    // conversationId), not AI execution failures — resolved before usage
    // tracking starts, so they're never logged as a failed AI turn.
    const conversation = dto.conversationId
      ? await this.getOwnedConversation(companyId, userId, dto.conversationId)
      : await this.db.aIConversation.create({
          data: { companyId, userId, title: dto.message.slice(0, 80) },
        });

    const startedAt = Date.now();
    let modelUsed = 'unknown';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const toolCallsMade: ToolCallRecord[] = [];

    const writeUsageLog = (status: 'SUCCESS' | 'FAILURE', errorMessage?: string) =>
      this.db.aIUsageLog.create({
        data: {
          companyId,
          userId,
          conversationId: conversation.id,
          model: modelUsed,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          toolCalls: toolCallsMade.length > 0 ? toolCallsMade : undefined,
          durationMs: Date.now() - startedAt,
          status,
          errorMessage,
        },
      });

    try {
      await this.db.aIMessage.create({
        data: { conversationId: conversation.id, companyId, role: 'USER', content: dto.message },
      });

      const priorMessages = await this.db.aIMessage.findMany({
        where: { conversationId: conversation.id, companyId },
        orderBy: { sequence: 'asc' },
      });
      const llmMessages: LlmMessage[] = [
        // Built fresh per turn, never persisted (AIMessageRole has no SYSTEM
        // on purpose) — so identity/context updates apply to old
        // conversations immediately.
        { role: 'system', content: await this.buildSystemPrompt(companyId) },
        ...priorMessages.map((m) => ({
          role: m.role.toLowerCase() as LlmMessage['role'],
          content: m.content,
        })),
      ];

      // Tools the model is even offered are pre-filtered by the caller's
      // permissions — deny by omission, not by asking the model to decline.
      const availableTools = this.toolRegistry
        .list()
        .filter((tool) => userPermissions.includes(tool.requiredPermission));
      const toolSchemas = availableTools.map(({ name, description, parameters }) => ({
        name,
        description,
        parameters,
      }));

      let completion = await this.llmProvider.complete({ messages: llmMessages, tools: toolSchemas });
      modelUsed = completion.model;
      totalInputTokens += completion.usage.inputTokens;
      totalOutputTokens += completion.usage.outputTokens;

      // Bounded loop — a misbehaving provider can't spin forever or run up
      // unbounded tool-call cost for a single user turn.
      let iterations = 0;
      while (completion.toolCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
        iterations += 1;

        for (const call of completion.toolCalls) {
          const tool = availableTools.find((t) => t.name === call.name);
          let resultPayload: unknown;
          let success = true;
          let callError: string | undefined;

          if (!tool) {
            resultPayload = { error: 'Permission denied for this tool.' };
            success = false;
            callError = 'permission_denied';
          } else {
            try {
              resultPayload = await tool.execute(companyId, call.arguments);
            } catch (err) {
              resultPayload = { error: 'This tool failed to execute.' };
              success = false;
              callError = err instanceof Error ? err.message : 'Unknown tool error';
            }
          }

          toolCallsMade.push({
            name: call.name,
            arguments: call.arguments,
            success,
            ...(callError ? { error: callError } : {}),
          });

          const toolMessageContent = JSON.stringify({ tool: call.name, arguments: call.arguments, result: resultPayload });
          await this.db.aIMessage.create({
            data: { conversationId: conversation.id, companyId, role: 'TOOL', content: toolMessageContent },
          });
          llmMessages.push({ role: 'tool', content: toolMessageContent, toolName: call.name });
        }

        completion = await this.llmProvider.complete({ messages: llmMessages, tools: toolSchemas });
        modelUsed = completion.model;
        totalInputTokens += completion.usage.inputTokens;
        totalOutputTokens += completion.usage.outputTokens;
      }

      const assistantMessage = await this.db.aIMessage.create({
        data: { conversationId: conversation.id, companyId, role: 'ASSISTANT', content: completion.content ?? '' },
      });

      // A turn can still produce an assistant reply even if a tool call
      // failed along the way (graceful degradation) — the usage log is what
      // honestly records that the turn wasn't entirely clean.
      const failedCalls = toolCallsMade.filter((c) => !c.success);
      await writeUsageLog(
        failedCalls.length > 0 ? 'FAILURE' : 'SUCCESS',
        failedCalls.length > 0 ? `Tool(s) failed: ${failedCalls.map((c) => c.name).join(', ')}` : undefined,
      );

      return { conversationId: conversation.id, message: assistantMessage };
    } catch (error) {
      // Catastrophic failure (e.g. the LLM provider itself threw) — no
      // assistant message was produced; log and surface the error.
      await writeUsageLog('FAILURE', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async listConversations(companyId: string, userId: string, pagination: PaginationParams = {}) {
    return this.db.aIConversation.findMany({
      where: { companyId, userId },
      orderBy: { createdAt: 'desc' },
      ...(pagination.offset ? { skip: pagination.offset } : {}),
      ...(pagination.limit ? { take: pagination.limit } : {}),
    });
  }

  async getConversation(companyId: string, userId: string, id: string, pagination: PaginationParams = {}) {
    const conversation = await this.getOwnedConversation(companyId, userId, id);
    const messages = await this.db.aIMessage.findMany({
      where: { conversationId: id, companyId },
      orderBy: { sequence: 'asc' },
      ...(pagination.offset ? { skip: pagination.offset } : {}),
      ...(pagination.limit ? { take: pagination.limit } : {}),
    });
    return { ...conversation, messages };
  }

  async deleteConversation(companyId: string, userId: string, id: string) {
    await this.getOwnedConversation(companyId, userId, id);
    await this.db.aIConversation.delete({ where: { id, companyId } });
  }

  /**
   * Executes a previously-proposed write action — the only place in this
   * service that ever mutates business data. Deliberately does not accept
   * the action's params from the request body: it re-reads the persisted
   * TOOL message (ownership-checked via getOwnedConversation, so a user can
   * only confirm actions from their own conversation), re-parses the exact
   * payload the tool produced, and re-dispatches through the same
   * permission-checked service method a human would use from the regular
   * UI. A client cannot forge or edit an action by posting arbitrary
   * params — only a real, previously-proposed tool call can be confirmed.
   */
  async confirmAction(companyId: string, userId: string, conversationId: string, messageId: string) {
    await this.getOwnedConversation(companyId, userId, conversationId);

    const toolMessage = await this.db.aIMessage.findFirst({
      where: { id: messageId, conversationId, companyId, role: 'TOOL' },
    });
    if (!toolMessage) {
      throw new NotFoundException('Action not found.');
    }

    let parsed: { tool: string; arguments: unknown; result: Partial<AIPendingActionResult> };
    try {
      parsed = JSON.parse(toolMessage.content);
    } catch {
      throw new BadRequestException('This message is not a valid action.');
    }

    // Also the guard against double-confirmation: a successful confirm
    // below flips this same field to false on the stored message, so a
    // second attempt (double-click, stale tab) lands here instead of
    // recording the payment twice.
    if (!parsed.result?.pendingConfirmation) {
      throw new ConflictException('This action is no longer pending — it may have already been confirmed.');
    }

    if (parsed.result.action === 'RECORD_CUSTOMER_PAYMENT') {
      const params = parsed.result.params as {
        customerId: string;
        customerName: string;
        amount: number;
        method: PaymentMethod;
        note?: string;
      };

      const ledger = await this.paymentsService.recordPayment(companyId, params.customerId, userId, {
        amount: params.amount,
        method: params.method,
        note: params.note,
      });

      await this.db.aIMessage.update({
        where: { id: toolMessage.id, companyId },
        data: {
          content: JSON.stringify({
            ...parsed,
            result: { ...parsed.result, pendingConfirmation: false, confirmed: true },
          }),
        },
      });

      const confirmationMessage = await this.db.aIMessage.create({
        data: {
          conversationId,
          companyId,
          role: 'ASSISTANT',
          content: `✓ Recorded a ${params.method.toLowerCase()} payment of ${params.amount} from ${params.customerName}. Remaining balance: ${ledger.remaining}.`,
        },
      });

      return { message: confirmationMessage };
    }

    throw new BadRequestException(`Unknown action type: ${String(parsed.result.action)}`);
  }

  /** The assistant's identity and business context. Grounded in the actual
   * company record so answers use the right currency and "today", and
   * bilingual by rule: it mirrors the user's language rather than defaulting
   * to English — Arabic is a first-class citizen, not a translation. */
  private async buildSystemPrompt(companyId: string): Promise<string> {
    // Company is deliberately outside the tenant-guarded model set (see
    // TenantGuardedPrismaService); this is a plain primary-key read.
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: { name: true, currency: true },
    });

    return [
      `You are the ERP Smart assistant — the built-in business analyst for "${company?.name ?? 'this business'}".`,
      `The company's currency is ${company?.currency ?? 'USD'}. Today's date is ${new Date().toISOString().slice(0, 10)}.`,
      'Always answer in the language of the user\'s most recent message: Arabic in, Arabic out; English in, English out.',
      'Be calm and concise: lead with the number or the answer, then at most two short supporting sentences. No filler.',
      'For any question about actual business data (sales, revenue, inventory, customers), use the provided tools — never invent or estimate figures yourself.',
      'If a tool fails or you have no tool for the data requested, say so plainly and point the user to the relevant section of the app.',
    ].join('\n');
  }

  private async getOwnedConversation(companyId: string, userId: string, id: string) {
    // Enforces PRIVATE visibility: always scoped by companyId AND userId,
    // never companyId alone. COMPANY visibility (schema already supports it
    // via AIConversation.visibility) would relax this userId check for
    // conversations with visibility: 'COMPANY' — not implemented in this
    // pass, per scope.
    const conversation = await this.db.aIConversation.findFirst({ where: { id, companyId, userId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }
    return conversation;
  }
}
