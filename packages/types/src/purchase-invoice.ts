import type { Product } from './product';
import type { PaymentStatus } from './sale';
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

/** Matches GET /purchase-invoices (list) — no items, mirroring how GET
 * /sales and GET /invoices both omit line detail from their list
 * responses. invoiceNumber is our own system-generated reference (e.g.
 * "PINV-0001"), assigned only on receive() — null on a DRAFT, exactly
 * mirroring how a Sale has no Invoice until it completes. paymentStatus is
 * a simple flip for now (see PurchaseInvoicesService.markPaid()); it
 * becomes a write-through cache of a real ledger once
 * SupplierPaymentsService exists, the same evolution Sale.paymentStatus
 * already went through. */
export interface PurchaseInvoice {
  id: string;
  companyId: string;
  supplierId: string;
  invoiceNumber: string | null;
  status: PurchaseInvoiceStatus;
  paymentStatus: PaymentStatus;
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

/** Matches GET /purchase-invoices/:id — the richer, itemized shape; the list
 * endpoint above returns plain PurchaseInvoice[]. Mirrors InvoiceDetail
 * exactly (base type doubles as the list shape, no separate
 * "ListItem"-suffixed type — this codebase doesn't use that naming anywhere
 * else, so PurchaseInvoiceDetail follows the existing split instead). */
export interface PurchaseInvoiceDetail extends PurchaseInvoice {
  items: PurchaseInvoiceItemWithProduct[];
  supplier: Supplier;
}

/** Matches POST /purchase-invoices and POST /purchase-invoices/:id/receive —
 * PurchaseInvoicesService.create()/receive() both include items (no product
 * join, no supplier); the list endpoint above does not include items at
 * all, and GET /:id includes both product and supplier. Mirrors
 * SaleWithItems exactly. */
export interface PurchaseInvoiceWithItems extends PurchaseInvoice {
  items: PurchaseInvoiceItem[];
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
// Deliberately no invoiceNumber field — it's system-generated (PINV-0001
// style) only when the invoice is received, never accepted from the
// client, matching CreateSaleDto's rule that system-generated fields are
// never client input.
export interface CreatePurchaseInvoiceInput {
  supplierId: string;
  dueDate?: string;
  discountTotal?: number;
  taxTotal?: number;
  items: CreatePurchaseInvoiceItemInput[];
}
