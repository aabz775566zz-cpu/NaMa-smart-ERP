import type { Invoice } from './invoice';

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

/** Money fields are Prisma Decimal, serialized as strings over JSON — never
 * do arithmetic on them client-side, always display/pass through verbatim. */
export interface SaleItem {
  id: string;
  companyId: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

/** Matches GET /sales (list) — SalesService.list() does NOT include items. */
export interface Sale {
  id: string;
  companyId: string;
  customerId: string | null;
  createdByUserId: string;
  status: SaleStatus;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Matches GET /sales/:id and POST /sales — SalesService.getById()/create()
 * both include items; the list endpoint above does not. */
export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

/** Matches POST /sales/:id/complete — SalesService.complete() additionally
 * returns the auto-generated invoice. */
export interface CompletedSaleResult extends SaleWithItems {
  invoice: Invoice;
}
