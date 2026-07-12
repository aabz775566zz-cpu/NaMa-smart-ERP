import type { AIChatResponse, AIConversation, AIConversationDetail, AIConversationListParams } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

export interface SendChatMessageInput {
  conversationId?: string;
  message: string;
}

function buildQuery(params?: AIConversationListParams) {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// If conversationId is omitted, the backend creates a new conversation and
// returns its id. The response only carries the final assistant message,
// not the full transcript (see AiService.chat()) — the caller must refetch
// GET /ai/conversations/:id for the authoritative ordered list.
export function sendChatMessage(input: SendChatMessageInput) {
  return apiClient.post<AIChatResponse>('/ai/chat', input);
}

export function listConversations(params?: AIConversationListParams) {
  return apiClient.get<AIConversation[]>(`/ai/conversations${buildQuery(params)}`);
}

export function getConversation(id: string, params?: AIConversationListParams) {
  return apiClient.get<AIConversationDetail>(`/ai/conversations/${id}${buildQuery(params)}`);
}

export function deleteConversation(id: string) {
  return apiClient.delete<void>(`/ai/conversations/${id}`);
}
