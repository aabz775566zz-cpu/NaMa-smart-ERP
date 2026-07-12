'use client';

import type { Invoice, InvoiceStatus } from '@erp-smart/types';
import { EmptyState, Skeleton, toast } from '@erp-smart/ui';
import { FileText, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

import { InvoiceDetailDialog } from '@/features/invoices/components/invoice-detail-dialog';
import { InvoicesTable } from '@/features/invoices/components/invoices-table';
import { InvoicesToolbar } from '@/features/invoices/components/invoices-toolbar';
import { useInvoices, useMarkInvoicePaid } from '@/features/invoices/hooks';
import { usePermissions } from '@/lib/store';

export default function InvoicesPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('INVOICES:READ');

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>(undefined);
  const invoicesQuery = useInvoices(statusFilter, { enabled: canRead });
  const markPaidMutation = useMarkInvoicePaid();

  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

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

  function handleMarkPaid(invoice: Invoice) {
    markPaidMutation.mutate(invoice.id, {
      onSuccess: () => toast({ title: 'Invoice marked as paid' }),
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Failed to mark invoice as paid', description: error.message });
      },
    });
  }

  const invoices = invoicesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground">Invoices are generated automatically when a sale is completed.</p>
      </div>

      <InvoicesToolbar status={statusFilter} onStatusChange={setStatusFilter} />

      {invoicesQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : invoicesQuery.isError ? (
        <EmptyState
          title="Couldn't load invoices"
          description={invoicesQuery.error instanceof Error ? invoicesQuery.error.message : 'Please try again.'}
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title={statusFilter ? `No ${statusFilter.toLowerCase()} invoices` : 'No invoices yet'}
          description={
            statusFilter ? 'Try a different status filter.' : 'Invoices appear here once a sale is completed.'
          }
        />
      ) : (
        <InvoicesTable
          invoices={invoices}
          onView={(invoice) => setViewingInvoiceId(invoice.id)}
          onMarkPaid={handleMarkPaid}
        />
      )}

      <InvoiceDetailDialog
        invoiceId={viewingInvoiceId}
        open={Boolean(viewingInvoiceId)}
        onOpenChange={(open) => !open && setViewingInvoiceId(null)}
      />
    </div>
  );
}
