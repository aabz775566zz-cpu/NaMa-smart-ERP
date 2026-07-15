import { describe, expect, it, vi } from 'vitest';

import * as inventoryHooks from '@/features/inventory/hooks';
import * as invoicesHooks from '@/features/invoices/hooks';
import { useAuthStore } from '@/lib/store';
import { renderWithProviders, screen } from '@/test/test-utils';

import { AttentionList } from './attention-list';

vi.mock('@/features/inventory/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/inventory/hooks')>();
  return { ...actual, useLowStock: vi.fn() };
});

vi.mock('@/features/invoices/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/invoices/hooks')>();
  return { ...actual, useInvoices: vi.fn() };
});

function setPermissions(permissions: string[]) {
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'token',
    user: {
      sub: 'user-1',
      email: 'owner@example.com',
      companyId: 'company-1',
      roleId: 'role-1',
      roleKey: 'OWNER',
      permissions: permissions as never,
      platformRole: 'USER',
    },
  });
}

describe('AttentionList', () => {
  it('renders nothing when the user has neither permission', () => {
    setPermissions([]);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);

    const { container } = renderWithProviders(<AttentionList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the calm empty state when both sections are permitted and empty', () => {
    setPermissions(['INVENTORY:READ', 'INVOICES:READ']);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({ data: [], isLoading: false, isError: false } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({ data: [], isLoading: false, isError: false } as never);

    renderWithProviders(<AttentionList />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it('shows only the low-stock section when the user lacks INVOICES:READ', () => {
    setPermissions(['INVENTORY:READ']);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({
      data: [
        {
          id: 'p1',
          companyId: 'c1',
          categoryId: null,
          name: 'Widget',
          description: null,
          sku: null,
          imageUrl: null,
          purchasePrice: '5.00',
          sellingPrice: '10.00',
          quantityOnHand: 1,
          unit: 'pcs',
          lowStockThreshold: 5,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);

    renderWithProviders(<AttentionList />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.queryByText('Overdue invoices')).not.toBeInTheDocument();
  });

  it('filters invoices to only overdue ones before rendering the overdue section', () => {
    setPermissions(['INVOICES:READ']);
    vi.mocked(inventoryHooks.useLowStock).mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);
    vi.mocked(invoicesHooks.useInvoices).mockReturnValue({
      data: [
        {
          id: 'i1',
          companyId: 'c1',
          saleId: 's1',
          invoiceNumber: 'INV-1',
          status: 'ISSUED',
          issueDate: '2020-01-01T00:00:00.000Z',
          dueDate: '2020-01-15T00:00:00.000Z',
          totalAmount: '10.00',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
        {
          id: 'i2',
          companyId: 'c1',
          saleId: 's2',
          invoiceNumber: 'INV-2',
          status: 'ISSUED',
          issueDate: '2099-01-01T00:00:00.000Z',
          dueDate: '2099-01-15T00:00:00.000Z',
          totalAmount: '20.00',
          createdAt: '2099-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as never);

    renderWithProviders(<AttentionList />);
    expect(screen.getByText('INV-1')).toBeInTheDocument();
    expect(screen.queryByText('INV-2')).not.toBeInTheDocument();
  });
});
