'use client';

import type { Product } from '@erp-smart/types';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp-smart/ui';
import { Download, Plus } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

const ALL_PRODUCTS = '__all__';

// Filters by GET /inventory/movements's real ?productId= query param.
export function InventoryToolbar({
  products,
  productId,
  onProductChange,
  onAdd,
  onExport,
}: {
  products: Product[];
  productId: string | undefined;
  onProductChange: (productId: string | undefined) => void;
  onAdd: () => void;
  onExport?: () => void;
}) {
  const canCreate = useHasPermission('INVENTORY:CREATE');
  const canExport = useHasPermission('INVENTORY:EXPORT');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={productId ?? ALL_PRODUCTS}
        onValueChange={(value) => onProductChange(value === ALL_PRODUCTS ? undefined : value)}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="All products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_PRODUCTS}>All products</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        {canExport && onExport ? (
          <Button variant="outline" onClick={onExport}>
            <Download />
            Export CSV
          </Button>
        ) : null}
        {canCreate ? (
          <Button onClick={onAdd}>
            <Plus />
            New adjustment
          </Button>
        ) : null}
      </div>
    </div>
  );
}
