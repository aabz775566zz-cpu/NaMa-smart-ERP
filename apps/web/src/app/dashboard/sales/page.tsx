'use client';

import type { Sale, SaleStatus } from '@erp-smart/types';
import { Button, EmptyState, Skeleton, toast } from '@erp-smart/ui';
import { ShieldAlert, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useCustomers } from '@/features/customers/hooks';
import { CancelSaleDialog } from '@/features/sales/components/cancel-sale-dialog';
import { SaleFormDialog } from '@/features/sales/components/sale-form-dialog';
import { SalesTable } from '@/features/sales/components/sales-table';
import { SalesToolbar } from '@/features/sales/components/sales-toolbar';
import { useCompleteSale, useSales } from '@/features/sales/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { usePermissions } from '@/lib/store';

export default function SalesPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('SALES:READ');
  const canReadCustomers = permissions.includes('CUSTOMERS:READ');

  const [statusFilter, setStatusFilter] = useState<SaleStatus | undefined>(undefined);
  const salesQuery = useSales(statusFilter, { enabled: canRead });
  const customersQuery = useCustomers({ enabled: canRead && canReadCustomers });
  const completeMutation = useCompleteSale();

  const [formOpen, setFormOpen] = useState(false);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    customersQuery.data?.forEach((customer) => map.set(customer.id, customer.name));
    return map;
  }, [customersQuery.data]);

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

  function handleComplete(sale: Sale) {
    completeMutation.mutate(sale.id, {
      onSuccess: (result) => {
        toast({ title: 'Sale completed', description: `Invoice ${result.invoice.invoiceNumber} generated.` });
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Failed to complete sale', description: error.message });
      },
    });
  }

  const sales = salesQuery.data ?? [];

  function handleExport() {
    exportToCsv('sales.csv', sales, [
      { header: 'Date', value: (s) => new Date(s.createdAt).toISOString().slice(0, 10) },
      { header: 'Customer', value: (s) => (s.customerId ? (customerNameById.get(s.customerId) ?? '') : 'Walk-in') },
      { header: 'Status', value: (s) => s.status },
      { header: 'Payment method', value: (s) => s.paymentMethod },
      { header: 'Payment status', value: (s) => s.paymentStatus },
      { header: 'Total', value: (s) => s.totalAmount },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground">Create draft sales and complete them to generate invoices.</p>
      </div>

      <SalesToolbar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onAdd={() => setFormOpen(true)}
        onExport={handleExport}
      />

      {salesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : salesQuery.isError ? (
        <EmptyState
          title="Couldn't load sales"
          description={salesQuery.error instanceof Error ? salesQuery.error.message : 'Please try again.'}
        />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title={statusFilter ? `No ${statusFilter.toLowerCase()} sales` : 'Record your first sale'}
          description={
            statusFilter
              ? 'Try a different status filter.'
              : 'Sales you create here decrement stock and generate invoices once completed.'
          }
          action={!statusFilter ? <Button onClick={() => setFormOpen(true)}>Create sale</Button> : undefined}
        />
      ) : (
        <SalesTable
          sales={sales}
          customerNameById={customerNameById}
          onComplete={handleComplete}
          onCancel={setCancellingSale}
        />
      )}

      <SaleFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <CancelSaleDialog
        sale={cancellingSale}
        open={Boolean(cancellingSale)}
        onOpenChange={(open) => !open && setCancellingSale(null)}
      />
    </div>
  );
}
