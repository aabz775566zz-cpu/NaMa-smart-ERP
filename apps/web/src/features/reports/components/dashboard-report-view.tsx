'use client';

import { EmptyState, Skeleton, StatCard } from '@erp-smart/ui';
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import Link from 'next/link';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useDashboardReport } from '../hooks';

export function DashboardReportView() {
  const { data, isLoading, isError, error } = useDashboardReport();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.reports;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Link href="/dashboard/reports">
        <StatCard
          label={t.revenueThisMonth}
          value={formatMoney(data.revenueThisMonth)}
          icon={<DollarSign />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/sales">
        <StatCard
          label={t.salesThisMonth}
          value={data.salesCountThisMonth}
          icon={<ShoppingCart />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/customers">
        <StatCard
          label={t.totalCustomers}
          value={data.totalCustomers}
          icon={<Users />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/products">
        <StatCard
          label={t.activeProducts}
          value={data.totalActiveProducts}
          icon={<Package />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/inventory">
        <StatCard
          label={t.lowStockItems}
          value={data.lowStockCount}
          icon={<AlertTriangle />}
          className="transition-colors hover:border-primary"
        />
      </Link>
    </div>
  );
}
