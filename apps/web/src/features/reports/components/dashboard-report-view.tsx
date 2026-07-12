'use client';

import { EmptyState, Skeleton, StatCard } from '@erp-smart/ui';
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';

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
      <StatCard label="Revenue this month" value={data.revenueThisMonth} icon={<DollarSign />} />
      <StatCard label="Sales this month" value={data.salesCountThisMonth} icon={<ShoppingCart />} />
      <StatCard label="Total customers" value={data.totalCustomers} icon={<Users />} />
      <StatCard label="Active products" value={data.totalActiveProducts} icon={<Package />} />
      <StatCard label="Low stock items" value={data.lowStockCount} icon={<AlertTriangle />} />
    </div>
  );
}
