import type { Customer, CustomerLedger, PaymentMethod } from '@erp-smart/types';

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

// Mirrors CreatePaymentDto on the backend.
export interface RecordPaymentInput {
  amount: number;
  method?: PaymentMethod;
  note?: string;
}

export function listCustomers() {
  return apiClient.get<Customer[]>('/customers');
}

export function getCustomer(id: string) {
  return apiClient.get<Customer>(`/customers/${id}`);
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

export function getCustomerLedger(customerId: string) {
  return apiClient.get<CustomerLedger>(`/customers/${customerId}/ledger`);
}

export function recordPayment(customerId: string, input: RecordPaymentInput) {
  return apiClient.post<CustomerLedger>(`/customers/${customerId}/payments`, input);
}
