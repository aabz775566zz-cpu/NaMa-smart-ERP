'use client';

import type { InventoryMovementType } from '@erp-smart/types';
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
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function InventoryPage() {
  const { messages } = useLocale();
  const t = messages.inventory;
  const TYPE_LABELS: Record<InventoryMovementType, string> = {
    PURCHASE: t.typePurchase,
    SALE: t.typeSale,
    ADJUSTMENT: t.typeAdjustment,
    RETURN: t.typeReturn,
  };
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
          title={messages.common.accessDeniedTitle}
          description={messages.common.accessDeniedDescription}
        />
      </div>
    );
  }

  const movements = movementsQuery.data ?? [];

  function handleExport() {
    exportToCsv('inventory-movements.csv', movements, [
      { header: messages.common.date, value: (m) => new Date(m.createdAt).toISOString().slice(0, 10) },
      { header: messages.common.product, value: (m) => productNameById.get(m.productId) ?? '' },
      { header: t.type, value: (m) => TYPE_LABELS[m.type] },
      { header: t.quantity, value: (m) => m.quantityChange },
      { header: messages.common.note, value: (m) => m.note ?? '' },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
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
          title={t.couldNotLoad}
          description={movementsQuery.error instanceof Error ? movementsQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<Boxes />}
          title={productId ? t.noMovementsForProduct : t.noMovementsYet}
          description={
            productId
              ? t.tryDifferentFilter
              : t.emptyDescription
          }
          action={!productId ? <Button onClick={() => setFormOpen(true)}>{t.recordAdjustment}</Button> : undefined}
        />
      ) : (
        <MovementsTable movements={movements} productNameById={productNameById} />
      )}

      <AdjustmentFormDialog open={formOpen} onOpenChange={setFormOpen} products={productsQuery.data ?? []} />
    </div>
  );
}
