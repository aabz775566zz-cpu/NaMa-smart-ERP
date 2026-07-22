import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, type Content, type FunctionDeclaration } from '@google/genai';

import type {
  LlmCompletionParams,
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmToolCallRequest,
} from './llm-provider.interface';

// Default model per current Gemini guidance; override with GEMINI_MODEL.
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Real Google Gemini adapter for the provider-agnostic LlmProvider contract.
 * Mirrors AnthropicLlmProvider's shape exactly (same responsibilities split
 * with AiService, same message-flattening trick) so switching between
 * providers is purely a binding change in ai.module.ts.
 *
 * Message mapping note: like the Anthropic adapter, the flat LlmMessage
 * history has no native functionCall/functionResponse id linkage to replay,
 * so each turn's tool result is folded into the conversation as a plain
 * user-provided context message ("Result from <tool>: ...") instead. Every
 * complete() call is an independent request built fresh from the full
 * history. Tool schemas are passed through as raw JSON Schema via
 * parametersJsonSchema — no conversion to Gemini's Schema/Type enum shape
 * needed, matching how the other two adapters consume AiToolRegistryService's
 * plain-JSON-schema tool definitions.
 */
@Injectable()
export class GeminiLlmProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiLlmProvider.name);
  // The SDK's own env auto-detection looks for GOOGLE_API_KEY; passed
  // explicitly here so this project's naming stays consistent with the
  // other two adapters' ANTHROPIC_API_KEY / OPENAI_API_KEY.
  private readonly client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  private readonly model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  async complete(params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const { systemInstruction, contents } = this.toGeminiContents(params.messages);

    const functionDeclarations: FunctionDeclaration[] = params.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parametersJsonSchema: tool.parameters,
    }));

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(functionDeclarations.length ? { tools: [{ functionDeclarations }] } : {}),
      },
    });

    const functionCalls = response.functionCalls ?? [];
    const toolCalls: LlmToolCallRequest[] = functionCalls
      .filter((call) => call.name)
      .map((call, index) => ({
        id: call.id ?? `gemini-${Date.now()}-${index}`,
        name: call.name!,
        arguments: (call.args ?? {}) as Record<string, unknown>,
      }));

    if (toolCalls.length === 0 && !response.text) {
      this.logger.warn('Gemini returned no text and no function calls for this request');
    }

    return {
      content: response.text ?? null,
      toolCalls,
      model: this.model,
      usage: this.usage(response),
    };
  }

  private usage(response: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }): LlmCompletionResult['usage'] {
    return {
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  private toGeminiContents(messages: LlmMessage[]): { systemInstruction: string | undefined; contents: Content[] } {
    const systemParts: string[] = [];
    const out: Content[] = [];

    for (const message of messages) {
      const content = message.content?.trim();
      switch (message.role) {
        case 'system':
          // Gemini takes the system prompt as a separate top-level field.
          if (content) systemParts.push(message.content);
          break;
        case 'user':
          if (content) out.push({ role: 'user', parts: [{ text: message.content }] });
          break;
        case 'assistant':
          // A tool-call turn persists with empty content — nothing textual to
          // replay, so skip it (its result arrives as the next tool message).
          if (content) out.push({ role: 'model', parts: [{ text: message.content }] });
          break;
        case 'tool': {
          const label = message.toolName ? `Result from ${message.toolName}` : 'Tool result';
          out.push({ role: 'user', parts: [{ text: `${label}:\n${message.content}` }] });
          break;
        }
      }
    }

    return {
      systemInstruction: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
      contents: out,
    };
  }
}
