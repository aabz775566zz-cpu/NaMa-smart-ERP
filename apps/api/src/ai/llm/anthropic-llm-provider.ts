import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';

import type {
  LlmCompletionParams,
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmToolCallRequest,
} from './llm-provider.interface';

// Default model per the Claude API guidance — Opus 4.8 is the current most
// capable model; override with ANTHROPIC_MODEL. Max output tokens is kept
// generous enough for adaptive thinking + a business answer while staying
// well under the SDK's non-streaming HTTP timeout.
const DEFAULT_MODEL = 'claude-opus-4-8';
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Real Anthropic (Claude) adapter for the provider-agnostic LlmProvider
 * contract. AiService owns tool *execution* (permission gating, tenant
 * isolation, persistence); this adapter only decides *which* tools to call
 * and narrates results, exactly like StubLlmProvider — so binding this in
 * ai.module.ts is the only change needed to go from stub to real Claude.
 *
 * Message mapping note: the LlmMessage history is a flat OpenAI-style shape
 * ({role, content, toolName?}) that does not carry Anthropic's tool_use ->
 * tool_result id linkage. Rather than reconstruct that lossily, each turn's
 * tool result is folded into the conversation as plain user-provided context
 * ("Result from <tool>: ..."). Every complete() call is therefore an
 * independent, self-contained request built fresh from the full history —
 * which also sidesteps the "thinking blocks must be replayed" constraint that
 * only applies to native tool_use/tool_result continuations.
 */
@Injectable()
export class AnthropicLlmProvider implements LlmProvider {
  private readonly logger = new Logger(AnthropicLlmProvider.name);
  private readonly client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  private readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  private readonly maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS) || DEFAULT_MAX_TOKENS;

  async complete(params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const { system, messages } = this.toAnthropicMessages(params.messages);

    const tools: Anthropic.Tool[] = params.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema,
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      // Adaptive thinking: Claude decides when and how deeply to reason —
      // the right default for tool-using business Q&A. On Opus 4.8 thinking
      // is off unless requested explicitly, so this is required to enable it.
      thinking: { type: 'adaptive' },
      ...(system ? { system } : {}),
      ...(tools.length ? { tools } : {}),
      messages,
    });

    // Safety classifiers may decline a request (HTTP 200, stop_reason
    // "refusal") — never read content blindly. Return a calm message and no
    // tool calls; AiService persists/narrates it like any other reply.
    if (response.stop_reason === 'refusal') {
      const explanation =
        response.stop_details?.type === 'refusal' ? response.stop_details.explanation : null;
      this.logger.warn(`Claude declined a request (category: ${response.stop_details?.type ?? 'n/a'})`);
      return {
        content: explanation ?? "I'm not able to help with that request.",
        toolCalls: [],
        model: response.model,
        usage: this.usage(response),
      };
    }

    const textParts: string[] = [];
    const toolCalls: LlmToolCallRequest[] = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: (block.input ?? {}) as Record<string, unknown>,
        });
      }
      // 'thinking' blocks are intentionally not surfaced or persisted.
    }

    return {
      content: textParts.length > 0 ? textParts.join('') : null,
      toolCalls,
      model: response.model,
      usage: this.usage(response),
    };
  }

  private usage(response: Anthropic.Message): LlmCompletionResult['usage'] {
    return {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  private toAnthropicMessages(messages: LlmMessage[]): {
    system: string | undefined;
    messages: Anthropic.MessageParam[];
  } {
    const systemParts: string[] = [];
    const out: Anthropic.MessageParam[] = [];

    for (const message of messages) {
      const content = message.content?.trim();
      switch (message.role) {
        case 'system':
          // Anthropic takes the system prompt as a separate top-level field.
          if (content) systemParts.push(message.content);
          break;
        case 'user':
          if (content) out.push({ role: 'user', content: message.content });
          break;
        case 'assistant':
          // A tool-call turn persists with empty content — nothing textual to
          // replay, so skip it (its result arrives as the next tool message).
          if (content) out.push({ role: 'assistant', content: message.content });
          break;
        case 'tool': {
          const label = message.toolName ? `Result from ${message.toolName}` : 'Tool result';
          out.push({ role: 'user', content: `${label}:\n${message.content}` });
          break;
        }
      }
    }

    // Anthropic requires the conversation to open with a user turn.
    while (out.length > 0 && out[0].role === 'assistant') out.shift();

    return {
      system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
      messages: out,
    };
  }
}
