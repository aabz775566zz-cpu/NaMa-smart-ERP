'use client';

import { EmptyState, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';

import { useProductsReport } from '../hooks';
import { DateRangeFilter } from './date-range-filter';

export function ProductsReportView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState('');
  const formatMoney = useFormatMoney();
  const { data, isLoading, isError, error } = useProductsReport({
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
          title="Couldn't load the products report"
          description={error instanceof Error ? error.message : 'Please try again.'}
        />
      ) : data.length === 0 ? (
        <EmptyState title="No completed sales in this range" description="Try widening the date range." />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Estimated profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.productId}>
                  <TableCell className="font-medium text-foreground">{entry.productName}</TableCell>
                  <TableCell>{entry.quantitySold}</TableCell>
                  <TableCell>{formatMoney(entry.revenue)}</TableCell>
                  <TableCell>{formatMoney(entry.estimatedProfit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
