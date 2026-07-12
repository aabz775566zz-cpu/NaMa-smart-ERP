import type { Category, Product, ProductStatus } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// Local request shapes, not shared package types — these mirror
// CreateProductDto/UpdateProductDto on the backend but are specific to this
// feature's API client, same pattern as features/auth/api.ts's LoginInput.
export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  imageUrl?: string;
  categoryId?: string;
  purchasePrice: number;
  sellingPrice: number;
  lowStockThreshold?: number;
  status?: ProductStatus;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export function listProducts() {
  return apiClient.get<Product[]>('/products');
}

export function createProduct(input: CreateProductInput) {
  return apiClient.post<Product>('/products', input);
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return apiClient.patch<Product>(`/products/${id}`, input);
}

export function deleteProduct(id: string) {
  return apiClient.delete<void>(`/products/${id}`);
}

export function listCategories() {
  return apiClient.get<Category[]>('/categories');
}

export interface CreateCategoryInput {
  name: string;
}

export function createCategory(input: CreateCategoryInput) {
  return apiClient.post<Category>('/categories', input);
}
