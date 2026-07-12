'use client';

import { EmptyState, Skeleton, StatCard } from '@erp-smart/ui';
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import Link from 'next/link';

import { useDashboardReport } from '../hooks';

export function DashboardReportView() {
  const { data, isLoading, isError, error } = useDashboardReport();

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
        title="Couldn't load the overview"
        description={error instanceof Error ? error.message : 'Please try again.'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Link href="/dashboard/reports">
        <StatCard
          label="Revenue this month"
          value={data.revenueThisMonth}
          icon={<DollarSign />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/sales">
        <StatCard
          label="Sales this month"
          value={data.salesCountThisMonth}
          icon={<ShoppingCart />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/customers">
        <StatCard
          label="Total customers"
          value={data.totalCustomers}
          icon={<Users />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/products">
        <StatCard
          label="Active products"
          value={data.totalActiveProducts}
          icon={<Package />}
          className="transition-colors hover:border-primary"
        />
      </Link>
      <Link href="/dashboard/inventory">
        <StatCard
          label="Low stock items"
          value={data.lowStockCount}
          icon={<AlertTriangle />}
          className="transition-colors hover:border-primary"
        />
      </Link>
    </div>
  );
}
