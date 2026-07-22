import type {
  CreatePurchaseInvoiceInput,
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  PurchaseInvoiceStatus,
  PurchaseInvoiceWithItems,
} from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// CreatePurchaseInvoiceInput is already declared in @erp-smart/types
// (purchase-invoice.ts) — reused here rather than redeclared, since it
// mirrors CreatePurchaseInvoiceDto on the backend exactly. Same pattern as
// features/suppliers/api.ts.
export type { CreatePurchaseInvoiceInput };

// GET /purchase-invoices (list) does NOT include items — only GET /:id and
// POST / do. There is no PATCH/DELETE — a purchase invoice moves through
// receive/cancel/mark-paid sub-routes, never edited in place. Mirrors
// features/sales/api.ts exactly.
export function listPurchaseInvoices(status?: PurchaseInvoiceStatus) {
  const query = status ? `?status=${status}` : '';
  return apiClient.get<PurchaseInvoice[]>(`/purchase-invoices${query}`);
}

export function getPurchaseInvoice(id: string) {
  return apiClient.get<PurchaseInvoiceDetail>(`/purchase-invoices/${id}`);
}

export function createPurchaseInvoice(input: CreatePurchaseInvoiceInput) {
  return apiClient.post<PurchaseInvoiceWithItems>('/purchase-invoices', input);
}

export function receivePurchaseInvoice(id: string) {
  return apiClient.post<PurchaseInvoiceWithItems>(`/purchase-invoices/${id}/receive`);
}

export function cancelPurchaseInvoice(id: string) {
  return apiClient.post<PurchaseInvoice>(`/purchase-invoices/${id}/cancel`);
}

export function markPurchaseInvoicePaid(id: string) {
  return apiClient.post<PurchaseInvoice>(`/purchase-invoices/${id}/mark-paid`);
}
