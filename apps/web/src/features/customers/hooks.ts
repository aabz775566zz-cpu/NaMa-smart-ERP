'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as customersApi from './api';
import type { CreateCustomerInput, UpdateCustomerInput } from './api';

export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
};

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
