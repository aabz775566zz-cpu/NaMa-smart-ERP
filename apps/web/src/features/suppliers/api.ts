import type { CreateSupplierInput, Supplier, UpdateSupplierInput } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// CreateSupplierInput / UpdateSupplierInput are already declared in
// @erp-smart/types (supplier.ts) — reused here rather than redeclared, since
// they mirror CreateSupplierDto/UpdateSupplierDto on the backend exactly.
export type { CreateSupplierInput, UpdateSupplierInput };

export function listSuppliers() {
  return apiClient.get<Supplier[]>('/suppliers');
}

export function getSupplier(id: string) {
  return apiClient.get<Supplier>(`/suppliers/${id}`);
}

export function createSupplier(input: CreateSupplierInput) {
  return apiClient.post<Supplier>('/suppliers', input);
}

export function updateSupplier(id: string, input: UpdateSupplierInput) {
  return apiClient.patch<Supplier>(`/suppliers/${id}`, input);
}

export function deleteSupplier(id: string) {
  return apiClient.delete<void>(`/suppliers/${id}`);
}
