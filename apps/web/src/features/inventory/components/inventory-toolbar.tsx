'use client';

import type { Product } from '@erp-smart/types';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp-smart/ui';
import { Download, Plus } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
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
  const { messages } = useLocale();
  const t = messages.inventory;
  const canCreate = useHasPermission('INVENTORY:CREATE');
  const canExport = useHasPermission('INVENTORY:EXPORT');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={productId ?? ALL_PRODUCTS}
        onValueChange={(value) => onProductChange(value === ALL_PRODUCTS ? undefined : value)}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder={t.allProducts} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_PRODUCTS}>{t.allProducts}</SelectItem>
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
            {messages.common.exportCsv}
          </Button>
        ) : null}
        {canCreate ? (
          <Button onClick={onAdd}>
            <Plus />
            {t.newAdjustment}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
