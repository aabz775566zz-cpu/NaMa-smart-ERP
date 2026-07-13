'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invoicesKeys } from '@/features/invoices/hooks';
import { salesKeys } from '@/features/sales/hooks';

import * as customersApi from './api';
import type { CreateCustomerInput, RecordPaymentInput, UpdateCustomerInput } from './api';

export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  detail: (id: string) => [...customersKeys.all, 'detail', id] as const,
  ledger: (id: string) => [...customersKeys.all, 'ledger', id] as const,
};

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: customersKeys.detail(id ?? ''),
    queryFn: () => customersApi.getCustomer(id as string),
    enabled: Boolean(id),
  });
}

// `enabled` lets callers skip the request when the JWT's permission list
// already rules out CUSTOMERS:READ, instead of firing a request that's
// certain to 403 — same pattern as features/products/hooks.ts.
export function useCustomers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customersKeys.lists(),
    queryFn: customersApi.listCustomers,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customersApi.createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) => customersApi.updateCustomer(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
    },
  });
}

export function useCustomerLedger(customerId: string | null) {
  return useQuery({
    queryKey: customersKeys.ledger(customerId ?? ''),
    queryFn: () => customersApi.getCustomerLedger(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function useRecordPayment(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => customersApi.recordPayment(customerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.ledger(customerId) });
      // Recording a payment can flip Sale.paymentStatus/Invoice.status for
      // any of this customer's sales (see PaymentsService.recordPayment on
      // the backend) — same cross-module invalidation as useMarkInvoicePaid.
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.all });
    },
  });
}
