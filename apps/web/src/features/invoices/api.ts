import type { Invoice, InvoiceDetail, InvoiceStatus, PaginationParams } from '@erp-smart/types';

import { apiClient, buildQueryString } from '@/lib/api';

// No POST /invoices — invoices are only ever auto-generated when a Sale
// completes (SalesService.complete() -> InvoicesService.createForSaleWithTx).
// No DELETE and no general update — mark-paid is the only mutation, and it's
// a one-way ISSUED -> PAID transition (markPaid() 409s if already PAID).
// pagination is optional — omitted entirely, this is the exact same
// unbounded request it always was (see InvoicesService.list() on the backend).
export function listInvoices(status?: InvoiceStatus, pagination?: PaginationParams) {
  const query = buildQueryString({ status, limit: pagination?.limit, offset: pagination?.offset });
  return apiClient.get<Invoice[]>(`/invoices${query}`);
}

export function getInvoice(id: string) {
  return apiClient.get<InvoiceDetail>(`/invoices/${id}`);
}

export function markInvoicePaid(id: string) {
  return apiClient.post<Invoice>(`/invoices/${id}/mark-paid`);
}
