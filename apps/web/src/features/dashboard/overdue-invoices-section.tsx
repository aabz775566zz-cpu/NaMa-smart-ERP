'use client';

import type { Invoice } from '@erp-smart/types';
import { Badge, Skeleton } from '@erp-smart/ui';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

export function OverdueInvoicesSection({
  invoices,
  isLoading,
  isError,
}: {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const { messages, locale } = useLocale();
  const t = messages.dashboard;
  const formatMoney = useFormatMoney();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">{t.couldNotLoadOverdueInvoices}</p>;
  }

  const items = invoices ?? [];
  if (items.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        {t.overdueInvoicesSectionTitle}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((invoice) => (
          <li key={invoice.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href="/dashboard/invoices" className="truncate text-foreground hover:underline">
              {invoice.invoiceNumber}
            </Link>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant="destructive">
                {invoice.dueDate ? dateFormatter.format(new Date(invoice.dueDate)) : ''}
              </Badge>
              <span className="tabular-nums text-muted-foreground">{formatMoney(invoice.totalAmount)}</span>
            </span>
          </li>
        ))}
      </ul>
      {items.length > 5 ? (
        <Link href="/dashboard/invoices" className="text-xs font-medium text-primary hover:underline">
          {t.viewAllOverdueInvoices}
        </Link>
      ) : null}
    </div>
  );
}
