'use client';

import { EmptyState, Input, Skeleton, StatCard } from '@erp-smart/ui';
import { Banknote, Handshake, HandCoins, Receipt } from 'lucide-react';
import { useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useDailyCloseReport } from '../hooks';

// Local calendar date (not UTC) — a shop closing out "today" means their
// own local today, not whatever day it currently is in UTC.
function todayLocalDateInput(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function DailyCloseReportView() {
  const [date, setDate] = useState(todayLocalDateInput);
  const { data, isLoading, isError, error } = useDailyCloseReport({ date });
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.reports;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="daily-close-date" className="text-sm font-medium text-foreground">
          {messages.common.date}
        </label>
        <Input
          id="daily-close-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-auto"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError || !data ? (
        <EmptyState
          title={t.couldNotLoadDailyClose}
          description={error instanceof Error ? error.message : messages.common.pleaseTryAgain}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t.totalSales}
              value={formatMoney(data.totalSales)}
              icon={<Receipt />}
              description={t.completedSalesCount.replace('{{count}}', String(data.salesCount))}
            />
            <StatCard
              label={t.cashSales}
              value={formatMoney(data.cashSales)}
              icon={<Banknote />}
              description={t.cashSalesDescription}
            />
            <StatCard
              label={t.creditSales}
              value={formatMoney(data.creditSales)}
              icon={<Handshake />}
              description={t.creditSalesDescription}
            />
            <StatCard
              label={t.paymentsCollected}
              value={formatMoney(data.paymentsCollected)}
              icon={<HandCoins />}
              description={t.paymentsCollectedDescription}
            />
          </div>
          {data.salesCount === 0 ? <p className="text-sm text-muted-foreground">{t.noSalesOnDate}</p> : null}
        </>
      )}
    </div>
  );
}
