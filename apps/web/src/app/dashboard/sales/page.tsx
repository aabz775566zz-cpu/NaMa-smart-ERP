'use client';

import type { PaymentMethod, PaymentStatus, Sale, SaleStatus } from '@erp-smart/types';
import { Button, EmptyState, Skeleton, ToastAction, toast } from '@erp-smart/ui';
import { ShieldAlert, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useCustomers } from '@/features/customers/hooks';
import { CancelSaleDialog } from '@/features/sales/components/cancel-sale-dialog';
import { SaleFormDialog } from '@/features/sales/components/sale-form-dialog';
import { SalesTable } from '@/features/sales/components/sales-table';
import { SalesToolbar } from '@/features/sales/components/sales-toolbar';
import { useCompleteSale, useSales } from '@/features/sales/hooks';
import { useCompany } from '@/features/settings/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';
import { buildWhatsAppLink, interpolate } from '@/lib/whatsapp';

export default function SalesPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('SALES:READ');
  const canReadCustomers = permissions.includes('CUSTOMERS:READ');

  const [statusFilter, setStatusFilter] = useState<SaleStatus | undefined>(undefined);
  const salesQuery = useSales(statusFilter, { enabled: canRead });
  const customersQuery = useCustomers({ enabled: canRead && canReadCustomers });
  const completeMutation = useCompleteSale();
  const { data: company } = useCompany();
  const { messages } = useLocale();
  const t = messages.sales;
  const formatMoney = useFormatMoney();
  const STATUS_LABELS: Record<SaleStatus, string> = {
    DRAFT: t.statusDraft,
    COMPLETED: t.statusCompleted,
    CANCELLED: t.statusCancelled,
  };
  const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: messages.common.methodCash,
    CARD: messages.common.methodCard,
    TRANSFER: messages.common.methodTransfer,
    OTHER: messages.common.methodOther,
  };
  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PAID: messages.common.paymentStatusPaid,
    PARTIAL: messages.common.paymentStatusPartial,
    UNPAID: messages.common.paymentStatusUnpaid,
  };

  const [formOpen, setFormOpen] = useState(false);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    customersQuery.data?.forEach((customer) => map.set(customer.id, customer.name));
    return map;
  }, [customersQuery.data]);

  const customerPhoneById = useMemo(() => {
    const map = new Map<string, string | null>();
    customersQuery.data?.forEach((customer) => map.set(customer.id, customer.phone));
    return map;
  }, [customersQuery.data]);

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

  function handleComplete(sale: Sale) {
    completeMutation.mutate(sale.id, {
      onSuccess: (result) => {
        const phone = sale.customerId ? customerPhoneById.get(sale.customerId) : null;
        const message = company
          ? interpolate(messages.invoice.whatsAppMessage, {
              company: company.name,
              number: result.invoice.invoiceNumber,
              total: formatMoney(result.totalAmount),
            })
          : null;

        toast({
          title: t.saleCompleted,
          description: t.invoiceGenerated.replace('{{number}}', result.invoice.invoiceNumber),
          action: message ? (
            <ToastAction
              altText={messages.invoice.sendWhatsApp}
              onClick={() => window.open(buildWhatsAppLink(phone, message), '_blank', 'noopener,noreferrer')}
            >
              {messages.invoice.sendWhatsApp}
            </ToastAction>
          ) : undefined,
        });
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: t.completeFailed, description: error.message });
      },
    });
  }

  const sales = salesQuery.data ?? [];

  function handleExport() {
    exportToCsv('sales.csv', sales, [
      { header: messages.common.date, value: (s) => new Date(s.createdAt).toISOString().slice(0, 10) },
      { header: messages.common.name, value: (s) => (s.customerId ? (customerNameById.get(s.customerId) ?? '') : t.walkIn) },
      { header: messages.common.status, value: (s) => STATUS_LABELS[s.status] },
      { header: t.paymentMethod, value: (s) => METHOD_LABELS[s.paymentMethod] },
      { header: t.paymentStatus, value: (s) => PAYMENT_STATUS_LABELS[s.paymentStatus] },
      { header: t.total, value: (s) => s.totalAmount },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
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
          title={t.couldNotLoad}
          description={salesQuery.error instanceof Error ? salesQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title={
            statusFilter === 'DRAFT'
              ? t.noStatusSalesDraft
              : statusFilter === 'COMPLETED'
                ? t.noStatusSalesCompleted
                : statusFilter === 'CANCELLED'
                  ? t.noStatusSalesCancelled
                  : t.recordFirstSale
          }
          description={
            statusFilter
              ? t.tryDifferentStatusFilter
              : t.emptyDescription
          }
          action={!statusFilter ? <Button onClick={() => setFormOpen(true)}>{t.createSale}</Button> : undefined}
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
