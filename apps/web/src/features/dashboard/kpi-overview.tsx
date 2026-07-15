'use client';

import { Card, EmptyState, Skeleton } from '@erp-smart/ui';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import Link from 'next/link';

import { useDashboardReport } from '@/features/reports/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

// A dashboard-only KPI strip — deliberately separate from
// features/reports/components/dashboard-report-view.tsx (which this same
// data also powers as the "Overview" tab on /dashboard/reports) so this
// component's presentation doesn't leak into the Reports page. Same real,
// permission-gated data either way; only the presentation differs: one
// unified panel with internal dividers, not five separate bordered cards —
// reads as a single analytics strip, and Revenue gets a tinted lead cell
// since it's the metric that matters most.
interface KpiTile {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  lead?: boolean;
}

export function KpiOverview() {
  const { data, isLoading, isError, error } = useDashboardReport();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.reports;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-none" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title={t.couldNotLoadOverview}
        description={error instanceof Error ? error.message : messages.common.pleaseTryAgain}
      />
    );
  }

  const tiles: KpiTile[] = [
    { label: t.revenueThisMonth, value: formatMoney(data.revenueThisMonth), href: '/dashboard/reports', icon: DollarSign, lead: true },
    { label: t.salesThisMonth, value: data.salesCountThisMonth, href: '/dashboard/sales', icon: ShoppingCart },
    { label: t.totalCustomers, value: data.totalCustomers, href: '/dashboard/customers', icon: Users },
    { label: t.activeProducts, value: data.totalActiveProducts, href: '/dashboard/products', icon: Package },
    { label: t.lowStockItems, value: data.lowStockCount, href: '/dashboard/inventory', icon: AlertTriangle },
  ];

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden p-0 duration-500 hover:shadow-sm">
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`group flex flex-col gap-2.5 p-5 transition-colors hover:bg-muted/40 sm:p-6 ${
              tile.lead ? 'bg-primary/[0.04]' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <tile.icon className={`h-4 w-4 ${tile.lead ? 'text-primary' : ''}`} />
              <span className="text-xs font-medium uppercase tracking-wide">{tile.label}</span>
            </div>
            <p
              className={`font-bold tabular-nums tracking-tight text-foreground ${
                tile.lead ? 'text-3xl sm:text-[2.25rem]' : 'text-2xl'
              }`}
            >
              {tile.value}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
