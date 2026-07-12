import type { Customer } from './customer';
import type { Product } from './product';
import type { PaymentMethod, PaymentStatus, SaleItem, SaleStatus } from './sale';

export type InvoiceStatus = 'ISSUED' | 'PAID';

/** Matches GET /invoices (list) and the base shape embedded elsewhere. */
export interface Invoice {
  id: string;
  companyId: string;
  saleId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  totalAmount: string;
  createdAt: string;
}

/** Line item shape specifically as returned by GET /invoices/:id, which
 * joins the product (InvoicesService.getById()'s `include`). */
export interface InvoiceSaleItem extends SaleItem {
  product: Product;
}

/** The Sale as embedded specifically in GET /invoices/:id's response —
 * includes items-with-product and customer, unlike the plain Sale type. */
export interface InvoiceSale {
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
  items: InvoiceSaleItem[];
  customer: Customer | null;
}

/** Matches GET /invoices/:id — the only endpoint that returns this richer,
 * itemized shape; GET /invoices (list) returns plain Invoice[]. */
export interface InvoiceDetail extends Invoice {
  sale: InvoiceSale;
}
