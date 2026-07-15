'use client';

import { EmptyState, Skeleton, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { AlertTriangle, Boxes, Package, Wallet } from 'lucide-react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useInventoryReport } from '../hooks';

export function InventoryReportView() {
  const { data, isLoading, isError, error } = useInventoryReport();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.reports;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title={t.couldNotLoadInventory}
        description={error instanceof Error ? error.message : messages.common.pleaseTryAgain}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.totalProducts} value={data.totalProducts} icon={<Package />} />
        <StatCard label={t.unitsInStock} value={data.totalUnitsInStock} icon={<Boxes />} />
        <StatCard label={t.stockValue} value={formatMoney(data.stockValue)} icon={<Wallet />} />
        <StatCard label={t.lowStockItems} value={data.lowStockCount} icon={<AlertTriangle />} />
      </div>

      {data.lowStockProducts.length === 0 ? (
        <EmptyState icon={<Boxes />} title={t.nothingLowOnStock} description={t.allAboveThreshold} />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{messages.common.product}</TableHead>
                <TableHead>{t.onHand}</TableHead>
                <TableHead>{t.threshold}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lowStockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell>{product.quantityOnHand}</TableCell>
                  <TableCell>{product.lowStockThreshold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
