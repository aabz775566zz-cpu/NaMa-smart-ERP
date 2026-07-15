'use client';

import { EmptyState, Skeleton, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { BarChart3, DollarSign, Receipt } from 'lucide-react';
import { useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useSalesReport } from '../hooks';
import { DateRangeFilter } from './date-range-filter';

export function SalesReportView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading, isError, error } = useSalesReport({ from: from || undefined, to: to || undefined });
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.reports;

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
          title={t.couldNotLoadSales}
          description={error instanceof Error ? error.message : messages.common.pleaseTryAgain}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label={t.totalRevenue} value={formatMoney(data.totalRevenue)} icon={<DollarSign />} />
            <StatCard label={t.totalSales} value={data.totalSales} icon={<Receipt />} />
            <StatCard label={t.averageSaleValue} value={formatMoney(data.averageSaleValue)} icon={<BarChart3 />} />
          </div>

          {data.dailyBreakdown.length === 0 ? (
            <EmptyState title={t.noSalesInRange} description={t.tryWideningRange} />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{messages.common.date}</TableHead>
                    <TableHead>{t.revenue}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dailyBreakdown.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                      <TableCell className="font-medium text-foreground">{formatMoney(entry.revenue)}</TableCell>
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
