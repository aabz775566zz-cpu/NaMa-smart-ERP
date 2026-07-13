import type { PaymentMethod } from './sale';

/** Matches PaymentsService.getLedger() — GET /customers/:id/ledger and the
 * response of POST /customers/:id/payments. Money fields are strings (same
 * Decimal-serialization convention as Sale/Invoice) — never do arithmetic
 * on them client-side. */

/** Per-sale allocation within a customer's ledger — computed fresh on every
 * read (FIFO, oldest sale first), never stored. */
export interface SaleAllocation {
  saleId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  createdAt: string;
  totalAmount: string;
  allocated: string;
  remaining: string;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export interface LedgerPayment {
  id: string;
  amount: string;
  method: PaymentMethod;
  note: string | null;
  createdAt: string;
}

export interface CustomerLedger {
  totalInvoiced: string;
  totalPaid: string;
  remaining: string;
  sales: SaleAllocation[];
  payments: LedgerPayment[];
}
