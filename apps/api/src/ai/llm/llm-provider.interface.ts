export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
}

export interface LlmToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmCompletionParams {
  messages: LlmMessage[];
  tools: LlmToolDefinition[];
}

export interface LlmCompletionResult {
  content: string | null;
  toolCalls: LlmToolCallRequest[];
  usage: { inputTokens: number; outputTokens: number };
  // Which model actually served this completion — AiService logs this
  // verbatim instead of hardcoding a provider name, so swapping providers
  // never requires an AiService change.
  model: string;
}

export interface LlmStreamChunk {
  contentDelta?: string;
  toolCallDelta?: Partial<LlmToolCallRequest>;
  done: boolean;
}

// Provider-agnostic on purpose — no vendor SDK referenced here. A concrete
// adapter (OpenAI, Anthropic, ...) implements this interface in a later
// pass; ai.module.ts binds LLM_PROVIDER to whichever implementation is
// current, so swapping vendors never touches AiService or the tool registry.
export interface LlmProvider {
  complete(params: LlmCompletionParams): Promise<LlmCompletionResult>;

  // Optional — a future streaming-capable provider implements this;
  // AiService does not call it in this pass (no streaming UI yet), but the
  // interface is ready so adding one later doesn't require another
  // interface change or touching existing non-streaming call sites.
  completeStream?(params: LlmCompletionParams): AsyncIterable<LlmStreamChunk>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
