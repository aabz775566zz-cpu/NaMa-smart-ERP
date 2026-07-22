/** Shared shape for query params accepted by every paginated list endpoint
 * (PaginationDto on the backend). Mirrors AIConversationListParams — the
 * one module that already had this — promoted here so every other list
 * hook reuses one type instead of redeclaring it per feature. */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}
