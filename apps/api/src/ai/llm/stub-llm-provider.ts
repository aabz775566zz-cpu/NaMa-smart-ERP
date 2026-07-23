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

// Narrow pattern exercising the write-capable propose_record_customer_payment
// tool end-to-end (propose -> confirm) without a real LLM's argument
// extraction — matches phrasing like "record a payment of 500 from Acme".
const RECORD_PAYMENT_PATTERN = /record .*payment of\s+([\d.]+)\s+(?:from|for)\s+(.+?)[.?!]?$/i;

// Same idea, reversed direction — paying a supplier rather than collecting
// from a customer. Deliberately uses "to" (never "from"/"for") so the two
// patterns never both match the same phrase.
const RECORD_SUPPLIER_PAYMENT_PATTERN = /record .*payment of\s+([\d.]+)\s+to\s+(?:supplier\s+)?(.+?)[.?!]?$/i;

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

      // Checked before the customer pattern: a supplier phrase like "...to
      // supplier Acme" would otherwise also satisfy the looser customer
      // regex's "for" alternative if it appeared earlier in the string.
      const supplierPaymentMatch = lastMessage.content.match(RECORD_SUPPLIER_PAYMENT_PATTERN);
      if (supplierPaymentMatch && params.tools.some((t) => t.name === 'propose_record_supplier_payment')) {
        const [, amountText, supplierName] = supplierPaymentMatch;
        return this.toolCallResult(params, [
          {
            id: `stub-${Date.now()}`,
            name: 'propose_record_supplier_payment',
            arguments: { amount: Number(amountText), supplierName: supplierName.trim() },
          },
        ]);
      }

      const paymentMatch = lastMessage.content.match(RECORD_PAYMENT_PATTERN);
      if (paymentMatch && params.tools.some((t) => t.name === 'propose_record_customer_payment')) {
        const [, amountText, customerName] = paymentMatch;
        return this.toolCallResult(params, [
          {
            id: `stub-${Date.now()}`,
            name: 'propose_record_customer_payment',
            arguments: { amount: Number(amountText), customerName: customerName.trim() },
          },
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
      ? this.narrateToolResult(toolResultContent)
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

  // Special-cases a propose_* tool's pendingConfirmation payload into a
  // readable sentence (using the summary the tool already built) instead of
  // dumping raw JSON — a real LLM would naturally phrase it this way too.
  // Any other tool result just gets echoed verbatim, same as before.
  private narrateToolResult(toolResultContent: string): string {
    try {
      const parsed = JSON.parse(toolResultContent) as { result?: { pendingConfirmation?: boolean; summary?: string; message?: string } };
      if (parsed.result?.pendingConfirmation && parsed.result.summary) {
        return `${parsed.result.summary} Shall I go ahead?`;
      }
      if (parsed.result?.message) {
        return parsed.result.message;
      }
    } catch {
      // Not JSON, or doesn't match the expected shape — fall through.
    }
    return `Here is what I found: ${toolResultContent}`;
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
