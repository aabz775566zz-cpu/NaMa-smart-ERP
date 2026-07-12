'use client';

import { EmptyState, Skeleton, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { BarChart3, DollarSign, Receipt } from 'lucide-react';
import { useState } from 'react';

import { useSalesReport } from '../hooks';
import { DateRangeFilter } from './date-range-filter';

export function SalesReportView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading, isError, error } = useSalesReport({ from: from || undefined, to: to || undefined });

  return (
    <div className="space-y-4">
      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onClear={() => {
          setFrom('');
          setTo('');
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError || !data ? (
        <EmptyState
          title="Couldn't load the sales report"
          description={error instanceof Error ? error.message : 'Please try again.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total revenue" value={data.totalRevenue} icon={<DollarSign />} />
            <StatCard label="Total sales" value={data.totalSales} icon={<Receipt />} />
            <StatCard label="Average sale value" value={data.averageSaleValue} icon={<BarChart3 />} />
          </div>

          {data.dailyBreakdown.length === 0 ? (
            <EmptyState title="No completed sales in this range" description="Try widening the date range." />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dailyBreakdown.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                      <TableCell className="font-medium text-foreground">{entry.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
