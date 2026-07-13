import type { LedgerPayment } from './payment';

/** Matches SuppliersService (not yet built) — GET/POST/PATCH /suppliers,
 * /suppliers/:id. Mirrors Customer exactly. */
export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Mirrors CreateSupplierDto/UpdateSupplierDto on the backend (not yet
// built) — same request-shape pattern as CreateCustomerInput/UpdateCustomerInput.
export interface CreateSupplierInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

/** Per-purchase-invoice allocation within a supplier's payable ledger —
 * computed fresh on every read (FIFO, oldest invoice first), never stored.
 * Mirrors SaleAllocation (see payment.ts) for the payable side. */
export interface PurchaseInvoiceAllocation {
  purchaseInvoiceId: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: string;
  allocated: string;
  remaining: string;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

/** Mirrors CustomerLedger (see payment.ts) for the payable side — money
 * fields are strings (Prisma Decimal serialized), never do arithmetic on
 * them client-side. Reuses LedgerPayment as-is (already generic — no
 * customerId/supplierId on it) rather than declaring a duplicate shape. */
export interface SupplierLedger {
  totalBilled: string;
  totalPaid: string;
  remaining: string;
  purchaseInvoices: PurchaseInvoiceAllocation[];
  payments: LedgerPayment[];
}
