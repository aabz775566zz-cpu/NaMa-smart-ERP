'use client';

import type { PaginationParams, SaleStatus } from '@erp-smart/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { productsKeys } from '@/features/products/hooks';

import * as salesApi from './api';
import type { CreateSaleInput } from './api';

export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  // GET /sales genuinely supports a ?status= filter server-side (unlike
  // Products/Customers), so each status gets its own cache entry rather than
  // filtering a single cached list client-side. `limit` is part of the key
  // too — SalesPage's "Load more" grows it, and each distinct value is
  // legitimately a different query (a shorter cached page must never be
  // served back once the user has asked for more).
  list: (status?: SaleStatus, pagination?: PaginationParams) =>
    [...salesKeys.lists(), status ?? 'ALL', pagination?.limit ?? 'ALL'] as const,
};

export function useSales(status?: SaleStatus, options?: { enabled?: boolean } & PaginationParams) {
  const { enabled, ...pagination } = options ?? {};
  return useQuery({
    queryKey: salesKeys.list(status, pagination),
    queryFn: () => salesApi.listSales(status, pagination),
    enabled: enabled ?? true,
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
      // Completing a sale decrements Product.quantityOnHand via internal
      // SALE-type inventory movements — same effect as Inventory's manual
      // adjustments, which already invalidate this cache (see
      // features/inventory/hooks.ts's useCreateAdjustment).
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
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
