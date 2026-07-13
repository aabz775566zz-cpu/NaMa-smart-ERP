import type { PaymentMethod } from './sale';

/** Matches a row in SupplierPayment (SupplierPaymentsService, not yet
 * built) — the payable-side equivalent of a customer Payment. Money fields
 * are strings (Prisma Decimal serialized), never do arithmetic on them
 * client-side. Deliberately no purchaseInvoiceId — mirrors Payment's
 * customer-ledger design: which invoice(s) a payment covers is derived at
 * read time (see SupplierLedger in supplier.ts), never stored. */
export interface SupplierPayment {
  id: string;
  companyId: string;
  supplierId: string;
  amount: string;
  method: PaymentMethod;
  note: string | null;
  createdByUserId: string;
  createdAt: string;
}

// Mirrors the shape a supplier-payment record endpoint (not yet built)
// would take — same convention as the customer side's RecordPaymentInput
// (features/customers/api.ts), just not yet promoted to a shared type there.
export interface CreateSupplierPaymentInput {
  amount: number;
  method?: PaymentMethod;
  note?: string;
}
