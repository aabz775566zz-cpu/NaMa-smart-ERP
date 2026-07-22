'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as suppliersApi from './api';
import type { CreateSupplierInput, RecordSupplierPaymentInput, UpdateSupplierInput } from './api';

export const suppliersKeys = {
  all: ['suppliers'] as const,
  lists: () => [...suppliersKeys.all, 'list'] as const,
  detail: (id: string) => [...suppliersKeys.all, 'detail', id] as const,
  ledger: (id: string) => [...suppliersKeys.all, 'ledger', id] as const,
};

// Deliberately the literal key, not an import of purchaseInvoicesKeys.all —
// features/purchase-invoices already depends on features/suppliers (for
// supplier name lookups), so importing back the other way would create a
// module cycle. This mirrors purchaseInvoicesKeys.all's value exactly.
const PURCHASE_INVOICES_QUERY_KEY = ['purchase-invoices'] as const;

// `enabled` lets callers skip the request when the JWT's permission list
// already rules out SUPPLIERS:READ, instead of firing a request that's
// certain to 403 — same pattern as features/customers/hooks.ts.
export function useSuppliers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: suppliersKeys.lists(),
    queryFn: suppliersApi.listSuppliers,
    enabled: options?.enabled ?? true,
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: suppliersKeys.detail(id ?? ''),
    queryFn: () => suppliersApi.getSupplier(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => suppliersApi.createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) => suppliersApi.updateSupplier(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
}

export function useSupplierLedger(supplierId: string | null) {
  return useQuery({
    queryKey: suppliersKeys.ledger(supplierId ?? ''),
    queryFn: () => suppliersApi.getSupplierLedger(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function useRecordSupplierPayment(supplierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordSupplierPaymentInput) => suppliersApi.recordSupplierPayment(supplierId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suppliersKeys.ledger(supplierId) });
      // Recording a payment can flip PurchaseInvoice.paymentStatus for any
      // of this supplier's received invoices (see
      // SupplierPaymentsService.recordPayment on the backend) — same
      // cross-module invalidation useRecordPayment already does on the
      // customer side.
      queryClient.invalidateQueries({ queryKey: PURCHASE_INVOICES_QUERY_KEY });
    },
  });
}
