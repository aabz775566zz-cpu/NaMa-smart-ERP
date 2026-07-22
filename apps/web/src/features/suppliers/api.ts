import type { CreateSupplierInput, PaymentMethod, Supplier, SupplierLedger, UpdateSupplierInput } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// CreateSupplierInput / UpdateSupplierInput are already declared in
// @erp-smart/types (supplier.ts) — reused here rather than redeclared, since
// they mirror CreateSupplierDto/UpdateSupplierDto on the backend exactly.
export type { CreateSupplierInput, UpdateSupplierInput };

// Mirrors CreateSupplierPaymentDto on the backend — same pattern as
// features/customers/api.ts's RecordPaymentInput.
export interface RecordSupplierPaymentInput {
  amount: number;
  method?: PaymentMethod;
  note?: string;
}

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

export function getSupplierLedger(supplierId: string) {
  return apiClient.get<SupplierLedger>(`/suppliers/${supplierId}/ledger`);
}

export function recordSupplierPayment(supplierId: string, input: RecordSupplierPaymentInput) {
  return apiClient.post<SupplierLedger>(`/suppliers/${supplierId}/payments`, input);
}
