'use client';

import { EmptyState, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useCustomersReport } from '../hooks';
import { DateRangeFilter } from './date-range-filter';

export function CustomersReportView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState('');
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.reports;
  const { data, isLoading, isError, error } = useCustomersReport({
    from: from || undefined,
    to: to || undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return (
    <div className="space-y-4">
      <DateRangeFilter
        from={from}
        to={to}
        limit={limit}
        showLimit
        onFromChange={setFrom}
        onToChange={setTo}
        onLimitChange={setLimit}
        onClear={() => {
          setFrom('');
          setTo('');
          setLimit('');
        }}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !data ? (
        <EmptyState
          title={t.couldNotLoadCustomers}
          description={error instanceof Error ? error.message : messages.common.pleaseTryAgain}
        />
      ) : data.length === 0 ? (
        // Walk-in sales (no customerId) are excluded from attribution — see
        // ReportsService.getCustomersReport()'s customerId: { not: null } filter.
        <EmptyState title={t.noAttributedSales} description={t.walkInExcluded} />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.customer}</TableHead>
                <TableHead>{t.totalSpent}</TableHead>
                <TableHead>{t.purchases}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.customerId}>
                  <TableCell className="font-medium text-foreground">{entry.customerName}</TableCell>
                  <TableCell>{formatMoney(entry.totalSpent)}</TableCell>
                  <TableCell>{entry.purchaseCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
