'use client';

import type { Invoice, InvoiceStatus } from '@erp-smart/types';
import { Button, EmptyState, LoadMoreButton, Skeleton, toast } from '@erp-smart/ui';
import { FileText, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { InvoiceDetailDialog } from '@/features/invoices/components/invoice-detail-dialog';
import { InvoicesTable } from '@/features/invoices/components/invoices-table';
import { InvoicesToolbar } from '@/features/invoices/components/invoices-toolbar';
import { useInvoices, useMarkInvoicePaid } from '@/features/invoices/hooks';
import { exportToCsv } from '@/lib/csv-export';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

// See apps/web/src/app/dashboard/sales/page.tsx for why this pages instead
// of loading every invoice at once.
const PAGE_SIZE = 50;

export default function InvoicesPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('INVOICES:READ');
  const { messages } = useLocale();
  const t = messages.invoices;
  const STATUS_LABELS: Record<InvoiceStatus, string> = {
    ISSUED: messages.invoice.paymentStatusIssued,
    PAID: messages.invoice.paymentStatusPaid,
  };

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const invoicesQuery = useInvoices(statusFilter, { enabled: canRead, limit: visibleCount });
  const isLoadingMore = invoicesQuery.isFetching && !invoicesQuery.isLoading;
  const markPaidMutation = useMarkInvoicePaid();

  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

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

  function handleMarkPaid(invoice: Invoice) {
    markPaidMutation.mutate(invoice.id, {
      onSuccess: () => toast({ title: t.markedPaid }),
      onError: (error) => {
        toast({ variant: 'destructive', title: t.markPaidFailed, description: error.message });
      },
    });
  }

  const invoices = invoicesQuery.data ?? [];
  const hasMore = invoices.length === visibleCount;

  function handleStatusChange(status: InvoiceStatus | undefined) {
    setStatusFilter(status);
    setVisibleCount(PAGE_SIZE);
  }

  function handleExport() {
    exportToCsv('invoices.csv', invoices, [
      { header: messages.invoice.invoiceNumber, value: (i) => i.invoiceNumber },
      { header: t.issueDate, value: (i) => new Date(i.issueDate).toISOString().slice(0, 10) },
      { header: t.dueDate, value: (i) => (i.dueDate ? new Date(i.dueDate).toISOString().slice(0, 10) : '') },
      { header: messages.common.status, value: (i) => STATUS_LABELS[i.status] },
      { header: t.total, value: (i) => i.totalAmount },
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <InvoicesToolbar status={statusFilter} onStatusChange={handleStatusChange} onExport={handleExport} />

      {invoicesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : invoicesQuery.isError ? (
        <EmptyState
          title={t.couldNotLoad}
          description={invoicesQuery.error instanceof Error ? invoicesQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title={
            statusFilter === 'ISSUED' ? t.noStatusIssued : statusFilter === 'PAID' ? t.noStatusPaid : t.noInvoicesYet
          }
          description={statusFilter ? t.tryDifferentStatusFilter : t.emptyDescription}
          action={
            !statusFilter ? (
              <Button asChild variant="outline">
                <Link href="/dashboard/sales">{t.goToSales}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <InvoicesTable
            invoices={invoices}
            onView={(invoice) => setViewingInvoiceId(invoice.id)}
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

      <InvoiceDetailDialog
        invoiceId={viewingInvoiceId}
        open={Boolean(viewingInvoiceId)}
        onOpenChange={(open) => !open && setViewingInvoiceId(null)}
      />
    </div>
  );
}
