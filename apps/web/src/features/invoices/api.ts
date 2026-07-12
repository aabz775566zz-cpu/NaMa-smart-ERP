import type { Invoice, InvoiceDetail, InvoiceStatus } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// No POST /invoices — invoices are only ever auto-generated when a Sale
// completes (SalesService.complete() -> InvoicesService.createForSaleWithTx).
// No DELETE and no general update — mark-paid is the only mutation, and it's
// a one-way ISSUED -> PAID transition (markPaid() 409s if already PAID).
export function listInvoices(status?: InvoiceStatus) {
  const query = status ? `?status=${status}` : '';
  return apiClient.get<Invoice[]>(`/invoices${query}`);
}

export function getInvoice(id: string) {
  return apiClient.get<InvoiceDetail>(`/invoices/${id}`);
}

export function markInvoicePaid(id: string) {
  return apiClient.post<Invoice>(`/invoices/${id}/mark-paid`);
}
