export type AIMessageRole = 'USER' | 'ASSISTANT' | 'TOOL';
export type AIConversationVisibility = 'PRIVATE' | 'COMPANY';

/** Matches GET /ai/conversations (list). */
export interface AIConversation {
  id: string;
  companyId: string;
  userId: string;
  visibility: AIConversationVisibility;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

/** content is a plain string on the wire — for TOOL-role messages it
 * happens to contain JSON (see AIToolCallResult below), but it is never
 * pre-parsed by the backend. Ordering is guaranteed by `sequence`, not
 * `createdAt` (see AIMessage.sequence in the Prisma schema). */
export interface AIMessage {
  id: string;
  conversationId: string;
  companyId: string;
  role: AIMessageRole;
  content: string;
  sequence: number;
  createdAt: string;
}

/** Matches GET /ai/conversations/:id — the only endpoint that includes
 * messages; the list endpoint above does not. */
export interface AIConversationDetail extends AIConversation {
  messages: AIMessage[];
}

/** Matches POST /ai/chat's response body (AiService.chat()'s return value). */
export interface AIChatResponse {
  conversationId: string;
  message: AIMessage;
}

/** The shape of AIMessage.content, once JSON.parse()'d, for a TOOL-role
 * message — this is what AiService.chat() actually stringifies per tool
 * call. `result` is whatever that specific tool's execute() returned (a
 * ReportsService/InventoryService response shape, or an
 * `{ error: string }` object if the call failed or was permission-denied —
 * see AiService.chat()'s per-call try/catch). */
export interface AIToolCallResult {
  tool: string;
  arguments: unknown;
  result: unknown;
}

/** Query params accepted by GET /ai/conversations and
 * GET /ai/conversations/:id (ListConversationsDto, reused for both). */
export interface AIConversationListParams {
  limit?: number;
  offset?: number;
}
