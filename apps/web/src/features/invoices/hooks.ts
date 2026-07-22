'use client';

import type { InvoiceStatus, PaginationParams } from '@erp-smart/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { salesKeys } from '@/features/sales/hooks';

import * as invoicesApi from './api';

export const invoicesKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoicesKeys.all, 'list'] as const,
  // GET /invoices genuinely supports a ?status= filter server-side — same
  // reasoning as salesKeys.list(), including `limit` in the key so a
  // "Load more" page and the original shorter page cache separately.
  list: (status?: InvoiceStatus, pagination?: PaginationParams) =>
    [...invoicesKeys.lists(), status ?? 'ALL', pagination?.limit ?? 'ALL'] as const,
  detail: (id: string) => [...invoicesKeys.all, 'detail', id] as const,
};

export function useInvoices(status?: InvoiceStatus, options?: { enabled?: boolean } & PaginationParams) {
  const { enabled, ...pagination } = options ?? {};
  return useQuery({
    queryKey: invoicesKeys.list(status, pagination),
    queryFn: () => invoicesApi.listInvoices(status, pagination),
    enabled: enabled ?? true,
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: invoicesKeys.detail(id ?? ''),
    queryFn: () => invoicesApi.getInvoice(id as string),
    enabled: Boolean(id),
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.markInvoicePaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesKeys.all });
      // markPaid() also flips the underlying Sale's paymentStatus to PAID in
      // the same backend transaction (InvoicesService.markPaid()) — a real
      // cross-module side effect, so the Sales cache goes stale too.
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}
