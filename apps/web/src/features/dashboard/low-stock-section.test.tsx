import type { Product } from '@erp-smart/types';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/test-utils';

import { LowStockSection } from './low-stock-section';

const PRODUCT: Product = {
  id: 'p1',
  companyId: 'c1',
  categoryId: null,
  name: 'Widget',
  description: null,
  sku: null,
  imageUrl: null,
  purchasePrice: '5.00',
  sellingPrice: '10.00',
  quantityOnHand: 2,
  unit: 'pcs',
  lowStockThreshold: 5,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LowStockSection', () => {
  it('shows a skeleton while loading', () => {
    const { container } = renderWithProviders(<LowStockSection products={undefined} isLoading isError={false} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an inline error message without throwing', () => {
    renderWithProviders(<LowStockSection products={undefined} isLoading={false} isError />);
    expect(screen.getByText("Couldn't load low-stock products")).toBeInTheDocument();
  });

  it('renders nothing when there are no low-stock products', () => {
    const { container } = renderWithProviders(<LowStockSection products={[]} isLoading={false} isError={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists low-stock products with their remaining quantity', () => {
    renderWithProviders(<LowStockSection products={[PRODUCT]} isLoading={false} isError={false} />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('2 pcs')).toBeInTheDocument();
  });
});
