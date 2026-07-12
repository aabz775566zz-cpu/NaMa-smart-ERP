'use client';

import type { SaleStatus } from '@erp-smart/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as salesApi from './api';
import type { CreateSaleInput } from './api';

export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  // GET /sales genuinely supports a ?status= filter server-side (unlike
  // Products/Customers), so each status gets its own cache entry rather than
  // filtering a single cached list client-side.
  list: (status?: SaleStatus) => [...salesKeys.lists(), status ?? 'ALL'] as const,
};

export function useSales(status?: SaleStatus, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.list(status),
    queryFn: () => salesApi.listSales(status),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}

export function useCompleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.completeSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.cancelSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}
