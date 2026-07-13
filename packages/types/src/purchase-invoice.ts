import type { Product } from './product';
import type { Supplier } from './supplier';

export type PurchaseInvoiceStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';

/** Money fields are Prisma Decimal, serialized as strings over JSON — never
 * do arithmetic on them client-side, always display/pass through verbatim.
 * Mirrors SaleItem, with unitCost replacing unitPrice (a purchase line's
 * cost, not a sale line's price). */
export interface PurchaseInvoiceItem {
  id: string;
  companyId: string;
  purchaseInvoiceId: string;
  productId: string;
  quantity: number;
  unitCost: string;
  lineTotal: string;
}

/** Matches GET /purchase-invoices (list, endpoint not yet built) — no items,
 * mirroring how GET /sales and GET /invoices both omit line detail from
 * their list responses. */
export interface PurchaseInvoice {
  id: string;
  companyId: string;
  supplierId: string;
  invoiceNumber: string;
  status: PurchaseInvoiceStatus;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  totalAmount: string;
  issueDate: string;
  dueDate: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Line item shape as returned by a future GET /purchase-invoices/:id,
 * joined with product — mirrors InvoiceSaleItem. */
export interface PurchaseInvoiceItemWithProduct extends PurchaseInvoiceItem {
  product: Product;
}

/** Matches a future GET /purchase-invoices/:id — the richer, itemized shape;
 * the list endpoint above returns plain PurchaseInvoice[]. Mirrors
 * InvoiceDetail exactly (base type doubles as the list shape, no separate
 * "ListItem"-suffixed type — this codebase doesn't use that naming anywhere
 * else, so PurchaseInvoiceDetail follows the existing split instead). */
export interface PurchaseInvoiceDetail extends PurchaseInvoice {
  items: PurchaseInvoiceItemWithProduct[];
  supplier: Supplier;
}

// Mirrors CreateSaleItemInput's shape, with one deliberate difference:
// unitCost IS client-supplied here, unlike CreateSaleItemInput which has no
// price field at all. A sale's price is always locked to the live
// Product.sellingPrice; a purchase invoice's cost comes from the supplier's
// bill and varies invoice to invoice, so it can't be server-derived the
// same way. Product.purchasePrice is only ever a prefill suggestion on the
// client, never authoritative for this input.
export interface CreatePurchaseInvoiceItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

// Mirrors CreateSaleInput's shape (supplierId replacing customerId).
// invoiceNumber/dueDate are additional — a purchase invoice is a real
// document entered from the supplier's bill, not system-generated the way
// a customer Invoice is, so its own reference number is client-supplied.
export interface CreatePurchaseInvoiceInput {
  supplierId: string;
  invoiceNumber: string;
  dueDate?: string;
  discountTotal?: number;
  taxTotal?: number;
  items: CreatePurchaseInvoiceItemInput[];
}
