import type { Invoice } from '@erp-smart/types';

/**
 * "Overdue" for this feature means an ISSUED invoice whose due date has
 * passed — see docs/features/premium-dashboard-ai-command-center-spec.md §C
 * for why this replaces a per-customer debt aggregate that doesn't exist
 * (Customer has no balance field; computing one per customer would be N+1).
 */
export function isInvoiceOverdue(invoice: Invoice, now: Date = new Date()): boolean {
  if (invoice.status !== 'ISSUED') return false;
  if (!invoice.dueDate) return false;
  return new Date(invoice.dueDate).getTime() < now.getTime();
}
