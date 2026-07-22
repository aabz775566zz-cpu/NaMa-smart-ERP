'use client';

import type { PaymentStatus, PurchaseInvoice, PurchaseInvoiceStatus } from '@erp-smart/types';
import { Button, EmptyState, LoadMoreButton, Skeleton, toast } from '@erp-smart/ui';
import { Receipt, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CancelPurchaseInvoiceDialog } from '@/features/purchase-invoices/components/cancel-purchase-invoice-dialog';
import { PurchaseInvoiceFormDialog } from '@/features/purchase-invoices/components/purchase-invoice-form-dialog';
import { PurchaseInvoicesTable } from '@/features/purchase-invoices/components/purchase-invoices-table';
import { PurchaseInvoicesToolbar } from '@/features/purchase-invoices/components/purchase-invoices-toolbar';
import {
  useMarkPurchaseInvoicePaid,
  usePurchaseInvoices,
  useReceivePurchaseInvoice,
} from '@/features/purchase-invoices/hooks';
import { useSuppliers } from '@/features/suppliers/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

// See apps/web/src/app/dashboard/sales/page.tsx for why this pages instead
// of loading every purchase invoice at once.
const PAGE_SIZE = 50;

export default function PurchaseInvoicesPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('PURCHASES:READ');
  const canReadSuppliers = permissions.includes('SUPPLIERS:READ');

  const [statusFilter, setStatusFilter] = useState<PurchaseInvoiceStatus | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const purchaseInvoicesQuery = usePurchaseInvoices(statusFilter, { enabled: canRead, limit: visibleCount });
  const isLoadingMore = purchaseInvoicesQuery.isFetching && !purchaseInvoicesQuery.isLoading;
  const suppliersQuery = useSuppliers({ enabled: canRead && canReadSuppliers });
  const receiveMutation = useReceivePurchaseInvoice();
  const markPaidMutation = useMarkPurchaseInvoicePaid();
  const { messages } = useLocale();
  const t = messages.purchaseInvoices;

  const [formOpen, setFormOpen] = useState(false);
  const [cancellingPurchaseInvoice, setCancellingPurchaseInvoice] = useState<PurchaseInvoice | null>(null);

  const supplierNameById = useMemo(() => {
    const map = new Map<string, string>();
    suppliersQuery.data?.forEach((supplier) => map.set(supplier.id, supplier.name));
    return map;
  }, [suppliersQuery.data]);

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

  function handleReceive(purchaseInvoice: PurchaseInvoice) {
    receiveMutation.mutate(purchaseInvoice.id, {
      onSuccess: () => toast({ title: t.purchaseInvoiceReceived }),
      onError: (error) => {
        toast({ variant: 'destructive', title: t.receiveFailed, description: error.message });
      },
    });
  }

  function handleMarkPaid(purchaseInvoice: PurchaseInvoice) {
    markPaidMutation.mutate(purchaseInvoice.id, {
      onSuccess: () => toast({ title: t.markedPaid }),
      onError: (error) => {
        toast({ variant: 'destructive', title: t.markPaidFailed, description: error.message });
      },
    });
  }

  const purchaseInvoices = purchaseInvoicesQuery.data ?? [];
  const hasMore = purchaseInvoices.length === visibleCount;

  function handleStatusChange(status: PurchaseInvoiceStatus | undefined) {
    setStatusFilter(status);
    setVisibleCount(PAGE_SIZE);
  }

  function handleExport() {
    const STATUS_LABELS: Record<PurchaseInvoiceStatus, string> = {
      DRAFT: t.statusDraft,
      RECEIVED: t.statusReceived,
      CANCELLED: t.statusCancelled,
    };
    const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
      PAID: messages.common.paymentStatusPaid,
      PARTIAL: messages.common.paymentStatusPartial,
      UNPAID: messages.common.paymentStatusUnpaid,
    };
    exportToCsv('purchase-invoices.csv', purchaseInvoices, [
      { header: messages.common.date, value: (p) => new Date(p.createdAt).toISOString().slice(0, 10) },
      { header: t.supplier, value: (p) => supplierNameById.get(p.supplierId) ?? '' },
      { header: messages.common.status, value: (p) => STATUS_LABELS[p.status] },
      { header: t.payment, value: (p) => PAYMENT_STATUS_LABELS[p.paymentStatus] },
      { header: t.total, value: (p) => p.totalAmount },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <PurchaseInvoicesToolbar
        status={statusFilter}
        onStatusChange={handleStatusChange}
        onAdd={() => setFormOpen(true)}
        onExport={handleExport}
      />

      {purchaseInvoicesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : purchaseInvoicesQuery.isError ? (
        <EmptyState
          title={t.couldNotLoad}
          description={
            purchaseInvoicesQuery.error instanceof Error
              ? purchaseInvoicesQuery.error.message
              : messages.common.pleaseTryAgain
          }
        />
      ) : purchaseInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title={
            statusFilter === 'DRAFT'
              ? t.noStatusPurchaseInvoicesDraft
              : statusFilter === 'RECEIVED'
                ? t.noStatusPurchaseInvoicesReceived
                : statusFilter === 'CANCELLED'
                  ? t.noStatusPurchaseInvoicesCancelled
                  : t.recordFirstPurchaseInvoice
          }
          description={statusFilter ? t.tryDifferentStatusFilter : t.emptyDescription}
          action={!statusFilter ? <Button onClick={() => setFormOpen(true)}>{t.newPurchaseInvoiceButton}</Button> : undefined}
        />
      ) : (
        <>
          <PurchaseInvoicesTable
            purchaseInvoices={purchaseInvoices}
            supplierNameById={supplierNameById}
            onReceive={handleReceive}
            onCancel={setCancellingPurchaseInvoice}
            onMarkPaid={handleMarkPaid}
          />
          {hasMore ? (
            <LoadMoreButton
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              loading={isLoadingMore}
              label={messages.common.loadMore}
            />
          ) : null}
        </>
      )}

      <PurchaseInvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <CancelPurchaseInvoiceDialog
        purchaseInvoice={cancellingPurchaseInvoice}
        open={Boolean(cancellingPurchaseInvoice)}
        onOpenChange={(open) => !open && setCancellingPurchaseInvoice(null)}
      />
    </div>
  );
}
