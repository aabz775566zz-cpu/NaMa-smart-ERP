'use client';

import type { Product } from '@erp-smart/types';
import { Badge, Skeleton } from '@erp-smart/ui';
import { PackageX } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';

export function LowStockSection({
  products,
  isLoading,
  isError,
}: {
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const { messages } = useLocale();
  const t = messages.dashboard;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">{t.couldNotLoadLowStock}</p>;
  }

  const items = products ?? [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <PackageX className="h-4 w-4 text-warning" />
        {t.lowStockSectionTitle}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href="/dashboard/inventory" className="truncate text-foreground hover:underline">
              {product.name}
            </Link>
            <Badge variant="warning" className="shrink-0 tabular-nums">
              {product.quantityOnHand} {product.unit}
            </Badge>
          </li>
        ))}
      </ul>
      {items.length > 5 ? (
        <Link href="/dashboard/inventory" className="text-xs font-medium text-primary hover:underline">
          {t.viewAllLowStock}
        </Link>
      ) : null}
    </div>
  );
}
