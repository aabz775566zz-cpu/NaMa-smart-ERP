'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { productsKeys } from '@/features/products/hooks';

import * as inventoryApi from './api';
import type { CreateAdjustmentInput } from './api';

export const inventoryKeys = {
  all: ['inventory'] as const,
  movements: (productId?: string) => [...inventoryKeys.all, 'movements', productId ?? 'ALL'] as const,
  lowStock: () => [...inventoryKeys.all, 'low-stock'] as const,
};

export function useMovements(productId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inventoryKeys.movements(productId),
    queryFn: () => inventoryApi.listMovements(productId),
    enabled: options?.enabled ?? true,
  });
}

export function useLowStock(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: inventoryApi.listLowStock,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdjustmentInput) => inventoryApi.createAdjustment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      // A movement changes Product.quantityOnHand directly (same DB write
      // that backs the Products list/table), so that cache goes stale too —
      // this is the real cross-module relationship the Products <->
      // Inventory backend has, not an assumption.
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}
