'use client';

import { EmptyState, Skeleton, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { AlertTriangle, Boxes, Package, Wallet } from 'lucide-react';

import { useInventoryReport } from '../hooks';

export function InventoryReportView() {
  const { data, isLoading, isError, error } = useInventoryReport();

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
        title="Couldn't load the inventory report"
        description={error instanceof Error ? error.message : 'Please try again.'}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total products" value={data.totalProducts} icon={<Package />} />
        <StatCard label="Units in stock" value={data.totalUnitsInStock} icon={<Boxes />} />
        <StatCard label="Stock value" value={data.stockValue} icon={<Wallet />} />
        <StatCard label="Low stock items" value={data.lowStockCount} icon={<AlertTriangle />} />
      </div>

      {data.lowStockProducts.length === 0 ? (
        <EmptyState icon={<Boxes />} title="Nothing low on stock" description="All products are above their threshold." />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>On hand</TableHead>
                <TableHead>Threshold</TableHead>
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
