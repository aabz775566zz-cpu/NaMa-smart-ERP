import type { Invoice } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { isInvoiceOverdue } from './overdue';

function makeInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    companyId: 'company-1',
    saleId: 'sale-1',
    invoiceNumber: 'INV-0001',
    status: 'ISSUED',
    issueDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-01-15T00:00:00.000Z',
    totalAmount: '100.00',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date('2026-02-01T00:00:00.000Z');

describe('isInvoiceOverdue', () => {
  it('is true for an ISSUED invoice whose due date has passed', () => {
    expect(isInvoiceOverdue(makeInvoice({}), NOW)).toBe(true);
  });

  it('is false for a PAID invoice past its due date', () => {
    expect(isInvoiceOverdue(makeInvoice({ status: 'PAID' }), NOW)).toBe(false);
  });

  it('is false for an ISSUED invoice with no due date set', () => {
    expect(isInvoiceOverdue(makeInvoice({ dueDate: null }), NOW)).toBe(false);
  });

  it('is false for an ISSUED invoice whose due date is in the future', () => {
    expect(isInvoiceOverdue(makeInvoice({ dueDate: '2026-03-01T00:00:00.000Z' }), NOW)).toBe(false);
  });
});
