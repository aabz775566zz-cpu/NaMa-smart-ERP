import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

import type {
  LlmCompletionParams,
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmToolCallRequest,
} from './llm-provider.interface';

// Default model per current OpenAI guidance; override with OPENAI_MODEL.
const DEFAULT_MODEL = 'gpt-5.6';

/**
 * Real OpenAI (GPT) adapter for the provider-agnostic LlmProvider contract.
 * Mirrors AnthropicLlmProvider's shape exactly (same responsibilities split
 * with AiService, same message-flattening trick) so switching between them
 * is purely a binding change in ai.module.ts — no other file cares which
 * vendor is active.
 *
 * Message mapping note: like the Anthropic adapter, the flat LlmMessage
 * history has no native tool_call_id to replay against OpenAI's
 * assistant.tool_calls / role:'tool' linkage, so each turn's tool result is
 * folded into the conversation as a plain user-provided context message
 * ("Result from <tool>: ...") instead. Every complete() call is therefore an
 * independent request built fresh from the full history.
 */
@Injectable()
export class OpenAiLlmProvider implements LlmProvider {
  private readonly logger = new Logger(OpenAiLlmProvider.name);
  private readonly client = new OpenAI(); // reads OPENAI_API_KEY from env
  private readonly model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  async complete(params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const messages = this.toOpenAiMessages(params.messages);

    const tools: ChatCompletionTool[] = params.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...(tools.length ? { tools } : {}),
    });

    const choice = response.choices[0];
    if (!choice) {
      this.logger.warn('OpenAI returned no choices for this request');
      return {
        content: "I'm not able to help with that request.",
        toolCalls: [],
        model: response.model,
        usage: this.usage(response),
      };
    }

    const toolCalls: LlmToolCallRequest[] = (choice.message.tool_calls ?? [])
      .filter((call) => call.type === 'function')
      .map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: this.parseArguments(call.function.arguments),
      }));

    return {
      content: choice.message.content ?? null,
      toolCalls,
      model: response.model,
      usage: this.usage(response),
    };
  }

  private usage(response: OpenAI.Chat.Completions.ChatCompletion): LlmCompletionResult['usage'] {
    return {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }

  private parseArguments(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      this.logger.warn(`OpenAI returned non-JSON tool arguments: ${raw}`);
      return {};
    }
  }

  private toOpenAiMessages(messages: LlmMessage[]): ChatCompletionMessageParam[] {
    const out: ChatCompletionMessageParam[] = [];

    for (const message of messages) {
      const content = message.content?.trim();
      switch (message.role) {
        case 'system':
          if (content) out.push({ role: 'system', content: message.content });
          break;
        case 'user':
          if (content) out.push({ role: 'user', content: message.content });
          break;
        case 'assistant':
          // A tool-call turn persists with empty content — nothing textual
          // to replay, so skip it (its result arrives as the next tool message).
          if (content) out.push({ role: 'assistant', content: message.content });
          break;
        case 'tool': {
          const label = message.toolName ? `Result from ${message.toolName}` : 'Tool result';
          out.push({ role: 'user', content: `${label}:\n${message.content}` });
          break;
        }
      }
    }

    return out;
  }
}
