import type { Customer } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// Local request shapes mirroring CreateCustomerDto/UpdateCustomerDto on the
// backend — same pattern as features/products/api.ts.
export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export function listCustomers() {
  return apiClient.get<Customer[]>('/customers');
}

export function createCustomer(input: CreateCustomerInput) {
  return apiClient.post<Customer>('/customers', input);
}

export function updateCustomer(id: string, input: UpdateCustomerInput) {
  return apiClient.patch<Customer>(`/customers/${id}`, input);
}

export function deleteCustomer(id: string) {
  return apiClient.delete<void>(`/customers/${id}`);
}
