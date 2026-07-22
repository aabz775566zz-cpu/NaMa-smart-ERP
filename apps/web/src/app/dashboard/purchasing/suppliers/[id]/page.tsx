'use client';

import { getDirection } from '@erp-smart/i18n';
import type { PaymentMethod } from '@erp-smart/types';
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp-smart/ui';
import { ArrowLeft, Printer, ShieldAlert, Wallet } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';

import { PurchaseInvoiceAllocationStatusBadge } from '@/features/suppliers/components/purchase-invoice-allocation-status-badge';
import { RecordSupplierPaymentDialog } from '@/features/suppliers/components/record-supplier-payment-dialog';
import { useSupplier, useSupplierLedger } from '@/features/suppliers/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission, usePermissions } from '@/lib/store';

// Mirrors apps/web/src/app/dashboard/customers/[id]/page.tsx exactly, for
// the payable side — this page IS "Supplier Payments" (no separate nav leaf
// exists for it, same as Customers has no standalone "Payments" page).
export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const t = messages.suppliers;
  const formatMoney = useFormatMoney();
  const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: messages.common.methodCash,
    CARD: messages.common.methodCard,
    TRANSFER: messages.common.methodTransfer,
    OTHER: messages.common.methodOther,
  };

  const permissions = usePermissions();
  const canRead = permissions.includes('SUPPLIERS:READ');
  // Recording a supplier payment is gated PURCHASES:UPDATE on the backend
  // (see supplier-payments.controller.ts), not SUPPLIERS:UPDATE — matches
  // the real permission model.
  const canRecordPayment = useHasPermission('PURCHASES:UPDATE');

  const { data: supplier, isLoading: supplierLoading } = useSupplier(canRead ? id : null);
  const { data: ledger, isLoading: ledgerLoading } = useSupplierLedger(canRead ? id : null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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

  const isLoading = supplierLoading || ledgerLoading;
  const remaining = ledger?.remaining ?? '0.00';
  const hasBalance = Number(remaining) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/purchasing/suppliers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className={direction === 'rtl' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          {t.backToSuppliers}
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          {t.printStatement}
        </Button>
      </div>

      {isLoading || !supplier || !ledger ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">{supplier.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[supplier.phone, supplier.email].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t.totalBilled} value={formatMoney(ledger.totalBilled)} />
            <StatCard label={t.totalPaid} value={formatMoney(ledger.totalPaid)} />
            <StatCard
              label={t.remaining}
              value={formatMoney(ledger.remaining)}
              icon={<Wallet />}
              description={hasBalance ? undefined : t.fullyPaid}
            />
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            {canRecordPayment ? (
              <Button onClick={() => setPaymentDialogOpen(true)}>{t.recordPayment}</Button>
            ) : null}
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t.invoiceHistory}</h2>
            {ledger.purchaseInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noPurchaseInvoices}</p>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.invoiceDate}</TableHead>
                      <TableHead>{t.invoiceNumber}</TableHead>
                      <TableHead>{t.invoiceTotal}</TableHead>
                      <TableHead>{t.allocated}</TableHead>
                      <TableHead>{t.remaining}</TableHead>
                      <TableHead>{messages.common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.purchaseInvoices.map((purchaseInvoice) => (
                      <TableRow key={purchaseInvoice.purchaseInvoiceId}>
                        <TableCell className="text-muted-foreground">
                          {new Date(purchaseInvoice.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{purchaseInvoice.invoiceNumber ?? '—'}</TableCell>
                        <TableCell>{formatMoney(purchaseInvoice.totalAmount)}</TableCell>
                        <TableCell>{formatMoney(purchaseInvoice.allocated)}</TableCell>
                        <TableCell>{formatMoney(purchaseInvoice.remaining)}</TableCell>
                        <TableCell>
                          <PurchaseInvoiceAllocationStatusBadge status={purchaseInvoice.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t.paymentHistory}</h2>
            {ledger.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noPayments}</p>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.invoiceDate}</TableHead>
                      <TableHead>{t.amount}</TableHead>
                      <TableHead>{t.paymentMethod}</TableHead>
                      <TableHead>{messages.common.note}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{formatMoney(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{METHOD_LABELS[payment.method]}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {payment.note ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {canRecordPayment ? (
            <RecordSupplierPaymentDialog
              supplierId={id}
              remaining={ledger.remaining}
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
