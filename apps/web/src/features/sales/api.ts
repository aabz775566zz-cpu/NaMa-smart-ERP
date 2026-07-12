import type { CompletedSaleResult, PaymentMethod, PaymentStatus, Sale, SaleStatus, SaleWithItems } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

// Deliberately no unitPrice/lineTotal/subtotal/totalAmount fields — those are
// always server-computed from live Product prices (SalesService.create()),
// never accepted from the client. Mirrors CreateSaleDto/CreateSaleItemDto.
export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  customerId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  discountTotal?: number;
  taxTotal?: number;
  items: CreateSaleItemInput[];
}

// GET /sales (list) does NOT include items — only GET /sales/:id and
// POST /sales do. There is no PATCH/DELETE /sales/:id; a sale is either
// completed or cancelled via dedicated sub-routes, never edited in place.
export function listSales(status?: SaleStatus) {
  const query = status ? `?status=${status}` : '';
  return apiClient.get<Sale[]>(`/sales${query}`);
}

export function createSale(input: CreateSaleInput) {
  return apiClient.post<SaleWithItems>('/sales', input);
}

export function completeSale(id: string) {
  return apiClient.post<CompletedSaleResult>(`/sales/${id}/complete`);
}

export function cancelSale(id: string) {
  return apiClient.post<Sale>(`/sales/${id}/cancel`);
}
