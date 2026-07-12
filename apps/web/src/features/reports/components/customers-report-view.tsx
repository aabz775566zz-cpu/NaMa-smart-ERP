'use client';

import { EmptyState, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';

import { useCustomersReport } from '../hooks';
import { DateRangeFilter } from './date-range-filter';

export function CustomersReportView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState('');
  const formatMoney = useFormatMoney();
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
          title="Couldn't load the customers report"
          description={error instanceof Error ? error.message : 'Please try again.'}
        />
      ) : data.length === 0 ? (
        // Walk-in sales (no customerId) are excluded from attribution — see
        // ReportsService.getCustomersReport()'s customerId: { not: null } filter.
        <EmptyState
          title="No attributed sales in this range"
          description="Walk-in sales without a customer aren't counted here."
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Total spent</TableHead>
                <TableHead>Purchases</TableHead>
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
