import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionKey } from '@erp-smart/types';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
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
      const llmMessages: LlmMessage[] = priorMessages.map((m) => ({
        role: m.role.toLowerCase() as LlmMessage['role'],
        content: m.content,
      }));

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
