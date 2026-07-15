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

import { DebtReminderButton } from '@/features/customers/components/debt-reminder-button';
import { RecordPaymentDialog } from '@/features/customers/components/record-payment-dialog';
import { SaleAllocationStatusBadge } from '@/features/customers/components/sale-allocation-status-badge';
import { useCustomer, useCustomerLedger } from '@/features/customers/hooks';
import { useCompany } from '@/features/settings/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission, usePermissions } from '@/lib/store';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const t = messages.customers;
  const formatMoney = useFormatMoney();
  const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: messages.common.methodCash,
    CARD: messages.common.methodCard,
    TRANSFER: messages.common.methodTransfer,
    OTHER: messages.common.methodOther,
  };

  const permissions = usePermissions();
  const canRead = permissions.includes('CUSTOMERS:READ');
  const canRecordPayment = useHasPermission('INVOICES:UPDATE');

  const { data: customer, isLoading: customerLoading } = useCustomer(canRead ? id : null);
  const { data: ledger, isLoading: ledgerLoading } = useCustomerLedger(canRead ? id : null);
  const { data: company } = useCompany();

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

  const isLoading = customerLoading || ledgerLoading;
  const remaining = ledger?.remaining ?? '0.00';
  const hasBalance = Number(remaining) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className={direction === 'rtl' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          {t.backToCustomers}
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          {t.printStatement}
        </Button>
      </div>

      {isLoading || !customer || !ledger ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[customer.phone, customer.email].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t.totalDebt} value={formatMoney(ledger.totalInvoiced)} />
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
            {hasBalance && company ? (
              <DebtReminderButton
                phone={customer.phone}
                companyName={company.name}
                remaining={formatMoney(ledger.remaining)}
              />
            ) : null}
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t.purchaseHistory}</h2>
            {ledger.sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noSales}</p>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.saleDate}</TableHead>
                      <TableHead>{t.saleInvoice}</TableHead>
                      <TableHead>{t.saleTotal}</TableHead>
                      <TableHead>{t.saleAllocated}</TableHead>
                      <TableHead>{t.saleRemaining}</TableHead>
                      <TableHead>{t.saleStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.sales.map((sale) => (
                      <TableRow key={sale.saleId}>
                        <TableCell className="text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{sale.invoiceNumber ?? '—'}</TableCell>
                        <TableCell>{formatMoney(sale.totalAmount)}</TableCell>
                        <TableCell>{formatMoney(sale.allocated)}</TableCell>
                        <TableCell>{formatMoney(sale.remaining)}</TableCell>
                        <TableCell>
                          <SaleAllocationStatusBadge status={sale.status} />
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
                      <TableHead>{t.saleDate}</TableHead>
                      <TableHead>{t.amount}</TableHead>
                      <TableHead>{t.paymentMethod}</TableHead>
                      <TableHead>{t.note}</TableHead>
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
            <RecordPaymentDialog
              customerId={id}
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
