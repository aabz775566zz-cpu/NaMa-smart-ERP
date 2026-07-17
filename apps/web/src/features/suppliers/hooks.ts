'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as suppliersApi from './api';
import type { CreateSupplierInput, UpdateSupplierInput } from './api';

export const suppliersKeys = {
  all: ['suppliers'] as const,
  lists: () => [...suppliersKeys.all, 'list'] as const,
  detail: (id: string) => [...suppliersKeys.all, 'detail', id] as const,
};

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
