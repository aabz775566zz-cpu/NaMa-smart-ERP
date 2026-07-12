'use client';

import type { AIConversationListParams } from '@erp-smart/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as aiApi from './api';
import type { SendChatMessageInput } from './api';

export const aiKeys = {
  all: ['ai'] as const,
  lists: () => [...aiKeys.all, 'conversations'] as const,
  conversations: (params?: AIConversationListParams) => [...aiKeys.lists(), params ?? {}] as const,
  conversation: (id: string) => [...aiKeys.all, 'conversation', id] as const,
};

export function useConversations(params?: AIConversationListParams) {
  return useQuery({
    queryKey: aiKeys.conversations(params),
    queryFn: () => aiApi.listConversations(params),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: aiKeys.conversation(id ?? ''),
    queryFn: () => aiApi.getConversation(id as string),
    enabled: Boolean(id),
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendChatMessageInput) => aiApi.sendChatMessage(input),
    onSuccess: (data) => {
      // The sidebar list needs refetching too — a brand-new conversation
      // (conversationId omitted from the request) now exists there.
      queryClient.invalidateQueries({ queryKey: aiKeys.conversation(data.conversationId) });
      queryClient.invalidateQueries({ queryKey: aiKeys.lists() });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.lists() });
    },
  });
}
