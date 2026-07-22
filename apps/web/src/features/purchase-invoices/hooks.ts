'use client';

import type { PaginationParams, PurchaseInvoiceStatus } from '@erp-smart/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { productsKeys } from '@/features/products/hooks';
import { suppliersKeys } from '@/features/suppliers/hooks';

import * as purchaseInvoicesApi from './api';
import type { CreatePurchaseInvoiceInput } from './api';

export const purchaseInvoicesKeys = {
  all: ['purchase-invoices'] as const,
  lists: () => [...purchaseInvoicesKeys.all, 'list'] as const,
  // GET /purchase-invoices genuinely supports a ?status= filter server-side
  // — same reasoning as salesKeys.list(), `limit` included for the same
  // "Load more" caching reason.
  list: (status?: PurchaseInvoiceStatus, pagination?: PaginationParams) =>
    [...purchaseInvoicesKeys.lists(), status ?? 'ALL', pagination?.limit ?? 'ALL'] as const,
  detail: (id: string) => [...purchaseInvoicesKeys.all, 'detail', id] as const,
};

export function usePurchaseInvoices(
  status?: PurchaseInvoiceStatus,
  options?: { enabled?: boolean } & PaginationParams,
) {
  const { enabled, ...pagination } = options ?? {};
  return useQuery({
    queryKey: purchaseInvoicesKeys.list(status, pagination),
    queryFn: () => purchaseInvoicesApi.listPurchaseInvoices(status, pagination),
    enabled: enabled ?? true,
  });
}

export function usePurchaseInvoice(id: string | null) {
  return useQuery({
    queryKey: purchaseInvoicesKeys.detail(id ?? ''),
    queryFn: () => purchaseInvoicesApi.getPurchaseInvoice(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseInvoiceInput) => purchaseInvoicesApi.createPurchaseInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseInvoicesKeys.lists() });
    },
  });
}

export function useReceivePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseInvoicesApi.receivePurchaseInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseInvoicesKeys.lists() });
      // Receiving posts real PURCHASE-type inventory movements and bumps
      // Product.quantityOnHand — same effect useCompleteSale already
      // accounts for on the sales side.
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}

export function useCancelPurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseInvoicesApi.cancelPurchaseInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseInvoicesKeys.lists() });
    },
  });
}

export function useMarkPurchaseInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseInvoicesApi.markPurchaseInvoicePaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseInvoicesKeys.lists() });
      // markPaid() also records an implicit SupplierPayment and reconciles
      // that supplier's ledger in the same backend transaction
      // (PurchaseInvoicesService.markPaid() -> settlePurchaseInvoiceInFull())
      // — a real cross-module side effect, so every supplier query
      // (list/detail/ledger) goes stale too. Mirrors useMarkInvoicePaid's
      // salesKeys.lists() invalidation on the sales side.
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
    },
  });
}
