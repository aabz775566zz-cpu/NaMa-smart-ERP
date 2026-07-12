import { Injectable } from '@nestjs/common';

import type {
  LlmCompletionParams,
  LlmCompletionResult,
  LlmMessage,
  LlmProvider,
  LlmToolCallRequest,
  LlmToolDefinition,
} from './llm-provider.interface';

// Temporary, local, deterministic placeholder — NOT a vendor integration and
// makes no external network calls. It exists so the tool-calling pipeline
// (permission gating, tenant isolation, conversation persistence, usage
// logging, including failure paths) can be exercised end-to-end in tests
// without a real LLM API key. Replace the LLM_PROVIDER binding in
// ai.module.ts with a real vendor adapter implementing LlmProvider when
// that decision is made — nothing else in this module needs to change.
const STUB_MODEL_NAME = 'stub-v1';

// Deliberately specific (not just "product" or "stock" alone) so phrases
// like "which products are running low" don't ambiguously match more than
// one tool depending on registry order.
const TOOL_KEYWORDS: Record<string, string[]> = {
  get_sales_summary: ['revenue', 'total sales', 'how much did i sell'],
  get_inventory_status: ['inventory status', 'stock value', 'stock valuation'],
  get_low_stock_products: ['low on stock', 'low stock', 'running low', 'out of stock'],
  get_top_customers: ['best customer', 'top customer', 'which customer'],
  get_top_products: ['best sell', 'top product'],
};

@Injectable()
export class StubLlmProvider implements LlmProvider {
  async complete(params: LlmCompletionParams): Promise<LlmCompletionResult> {
    // AiService always resends the FULL persisted conversation history, so
    // "does a tool message exist anywhere in this array" is true for every
    // turn after the first — not what we want. What actually distinguishes
    // "narrate a fresh tool result" from "a new question just arrived" is
    // whether the LAST message is the one that changed: a fresh USER
    // message means a new question (even in an old conversation with prior
    // tool history); a trailing TOOL message means AiService just appended
    // this turn's result and wants it narrated now.
    const lastMessage = params.messages[params.messages.length - 1];

    if (lastMessage?.role === 'tool') {
      return this.narrate(params, lastMessage.content);
    }

    if (lastMessage?.role === 'user') {
      const text = lastMessage.content.toLowerCase();

      // Deliberate, narrowly-worded trigger phrase (won't fire on normal
      // questions) that exercises the failed-tool-execution path: requests
      // get_top_products with a deliberately invalid `limit`, which
      // AiToolRegistryService's parseOptionalLimit() rejects.
      if (text.includes('trigger error') && params.tools.some((t) => t.name === 'get_top_products')) {
        return this.toolCallResult(params, [
          { id: `stub-${Date.now()}`, name: 'get_top_products', arguments: { limit: 'not-a-number' } },
        ]);
      }

      const matchedTool = this.matchTool(text, params.tools);
      if (matchedTool) {
        return this.toolCallResult(params, [{ id: `stub-${Date.now()}`, name: matchedTool, arguments: {} }]);
      }
    }

    return this.narrate(params, null);
  }

  private narrate(params: LlmCompletionParams, toolResultContent: string | null): LlmCompletionResult {
    const content = toolResultContent
      ? `Here is what I found: ${toolResultContent}`
      : "I'm a placeholder AI response — no real LLM provider is configured yet.";

    return {
      content,
      toolCalls: [],
      model: STUB_MODEL_NAME,
      usage: {
        inputTokens: this.estimateTokens(params.messages),
        outputTokens: this.estimateTokens([{ role: 'assistant', content }]),
      },
    };
  }

  private toolCallResult(params: LlmCompletionParams, toolCalls: LlmToolCallRequest[]): LlmCompletionResult {
    return {
      content: null,
      toolCalls,
      model: STUB_MODEL_NAME,
      usage: { inputTokens: this.estimateTokens(params.messages), outputTokens: 0 },
    };
  }

  private matchTool(text: string, tools: LlmToolDefinition[]): string | undefined {
    for (const tool of tools) {
      const keywords = TOOL_KEYWORDS[tool.name] ?? [];
      if (keywords.some((keyword) => text.includes(keyword))) {
        return tool.name;
      }
    }
    return undefined;
  }

  private estimateTokens(messages: LlmMessage[]): number {
    return messages.reduce((sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4), 0);
  }
}
