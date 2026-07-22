'use client';

import type { AIConversationListParams } from '@erp-smart/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { customersKeys } from '@/features/customers/hooks';
import { invoicesKeys } from '@/features/invoices/hooks';
import { salesKeys } from '@/features/sales/hooks';

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

export function useConfirmAiAction(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => aiApi.confirmAiAction(conversationId, messageId),
    onSuccess: () => {
      // Refetches the conversation so the confirmed message's
      // pendingConfirmation flips to false (never re-offered) and the new
      // "✓ Recorded..." assistant message appears.
      queryClient.invalidateQueries({ queryKey: aiKeys.conversation(conversationId) });
      // The only confirmable action today calls PaymentsService.recordPayment()
      // under the hood — same cross-module invalidation useRecordPayment
      // already does from the regular customer ledger UI, since this can flip
      // Sale.paymentStatus/Invoice.status too. Broad customersKeys.all (not
      // just .lists()) because this hook doesn't know which customer's
      // ledger was touched — the action's customerId lives inside the
      // confirmed tool-call message, not passed in here.
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.all });
    },
  });
}
