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

/** Action types a `propose_*` AI tool can produce — currently just one.
 * Add here as more write-capable tools are built (see
 * AiToolRegistryService's class doc comment for the two-phase design). */
export type AIPendingActionType = 'RECORD_CUSTOMER_PAYMENT';

/** The shape a `propose_*` tool's execute() returns as `result` inside a
 * TOOL message's AIToolCallResult — never written by the tool itself, only
 * proposed. The frontend detects this shape (via `pendingConfirmation`) to
 * render a Confirm/Cancel card instead of plain text. `params` is passed
 * back to POST /ai/conversations/:id/messages/:messageId/confirm verbatim,
 * but the backend never trusts it — it always re-reads and re-validates the
 * persisted message content, not whatever the client sends. */
export interface AIPendingActionResult {
  pendingConfirmation: true;
  action: AIPendingActionType;
  summary: string;
  params: Record<string, unknown>;
}

/** Matches POST /ai/conversations/:id/messages/:messageId/confirm. */
export interface AIConfirmActionResponse {
  message: AIMessage;
}
