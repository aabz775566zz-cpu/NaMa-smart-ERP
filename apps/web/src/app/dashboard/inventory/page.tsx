'use client';

import { Button, EmptyState, Skeleton } from '@erp-smart/ui';
import { Boxes, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdjustmentFormDialog } from '@/features/inventory/components/adjustment-form-dialog';
import { InventoryToolbar } from '@/features/inventory/components/inventory-toolbar';
import { LowStockPanel } from '@/features/inventory/components/low-stock-panel';
import { MovementsTable } from '@/features/inventory/components/movements-table';
import { useLowStock, useMovements } from '@/features/inventory/hooks';
import { useProducts } from '@/features/products/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { usePermissions } from '@/lib/store';

export default function InventoryPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('INVENTORY:READ');
  const canReadProducts = permissions.includes('PRODUCTS:READ');

  const [productId, setProductId] = useState<string | undefined>(undefined);
  const productsQuery = useProducts({ enabled: canRead && canReadProducts });
  const movementsQuery = useMovements(productId, { enabled: canRead });
  const lowStockQuery = useLowStock({ enabled: canRead });

  const [formOpen, setFormOpen] = useState(false);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    productsQuery.data?.forEach((product) => map.set(product.id, product.name));
    return map;
  }, [productsQuery.data]);

  if (!canRead) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<ShieldAlert />}
          title="You don't have access to this section"
          description="Ask a company owner or manager if you need this permission."
        />
      </div>
    );
  }

  const movements = movementsQuery.data ?? [];

  function handleExport() {
    exportToCsv('inventory-movements.csv', movements, [
      { header: 'Date', value: (m) => new Date(m.createdAt).toISOString().slice(0, 10) },
      { header: 'Product', value: (m) => productNameById.get(m.productId) ?? '' },
      { header: 'Type', value: (m) => m.type },
      { header: 'Quantity change', value: (m) => m.quantityChange },
      { header: 'Note', value: (m) => m.note ?? '' },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">Track stock movements and post manual adjustments.</p>
      </div>

      {lowStockQuery.data && lowStockQuery.data.length > 0 ? <LowStockPanel products={lowStockQuery.data} /> : null}

      <InventoryToolbar
        products={productsQuery.data ?? []}
        productId={productId}
        onProductChange={setProductId}
        onAdd={() => setFormOpen(true)}
        onExport={handleExport}
      />

      {movementsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : movementsQuery.isError ? (
        <EmptyState
          title="Couldn't load inventory movements"
          description={movementsQuery.error instanceof Error ? movementsQuery.error.message : 'Please try again.'}
        />
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<Boxes />}
          title={productId ? 'No movements for this product' : 'No stock movements yet'}
          description={
            productId
              ? 'Try a different product filter.'
              : 'Movements appear here as stock is purchased, sold, or adjusted — post a manual adjustment to get started.'
          }
          action={!productId ? <Button onClick={() => setFormOpen(true)}>Record adjustment</Button> : undefined}
        />
      ) : (
        <MovementsTable movements={movements} productNameById={productNameById} />
      )}

      <AdjustmentFormDialog open={formOpen} onOpenChange={setFormOpen} products={productsQuery.data ?? []} />
    </div>
  );
}
