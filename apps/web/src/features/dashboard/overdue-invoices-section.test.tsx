import type { Invoice } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

import { OverdueInvoicesSection } from './overdue-invoices-section';

const INVOICE: Invoice = {
  id: 'inv-1',
  companyId: 'c1',
  saleId: 's1',
  invoiceNumber: 'INV-0042',
  status: 'ISSUED',
  issueDate: '2026-01-01T00:00:00.000Z',
  dueDate: '2026-01-15T00:00:00.000Z',
  totalAmount: '150.00',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('OverdueInvoicesSection', () => {
  it('shows a skeleton while loading', () => {
    const { container } = renderWithProviders(
      <OverdueInvoicesSection invoices={undefined} isLoading isError={false} />,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an inline error message without throwing', () => {
    renderWithProviders(<OverdueInvoicesSection invoices={undefined} isLoading={false} isError />);
    expect(screen.getByText("Couldn't load overdue invoices")).toBeInTheDocument();
  });

  it('renders nothing when there are no overdue invoices', () => {
    const { container } = renderWithProviders(
      <OverdueInvoicesSection invoices={[]} isLoading={false} isError={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lists overdue invoices with their number and total', () => {
    renderWithProviders(<OverdueInvoicesSection invoices={[INVOICE]} isLoading={false} isError={false} />);
    expect(screen.getByText('INV-0042')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
});
