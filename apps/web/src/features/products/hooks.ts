'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as productsApi from './api';
import type { CreateCategoryInput, CreateProductInput, ImportProductRow, UpdateProductInput } from './api';

export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
};

export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
};

// `enabled` lets callers skip the request entirely when the JWT's permission
// list already rules out PRODUCTS:READ, instead of firing a request that's
// certain to 403 — the backend remains the real authority either way.
export function useProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productsKeys.lists(),
    queryFn: productsApi.listProducts,
    enabled: options?.enabled ?? true,
  });
}

export function useCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: categoriesKeys.lists(),
    queryFn: productsApi.listCategories,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => productsApi.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) => productsApi.updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}

// Deliberately no onSuccess cache invalidation here — the import dialog
// calls mutateAsync() many times in a chunk loop, and invalidating after
// every single chunk would refire the products/categories queries 20+
// times for a 5000-row file. The dialog invalidates both caches itself,
// once, after the whole import finishes.
export function useImportProducts() {
  return useMutation({
    mutationFn: (rows: ImportProductRow[]) => productsApi.importProducts(rows),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}
