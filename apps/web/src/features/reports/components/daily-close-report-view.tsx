'use client';

import { EmptyState, Input, Skeleton, StatCard } from '@erp-smart/ui';
import { Banknote, Handshake, HandCoins, Receipt } from 'lucide-react';
import { useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="daily-close-date" className="text-sm font-medium text-foreground">
          Date
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
          title="Couldn't load the daily close report"
          description={error instanceof Error ? error.message : 'Please try again.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total sales"
              value={formatMoney(data.totalSales)}
              icon={<Receipt />}
              description={`${data.salesCount} completed sale${data.salesCount === 1 ? '' : 's'}`}
            />
            <StatCard
              label="Cash sales"
              value={formatMoney(data.cashSales)}
              icon={<Banknote />}
              description="Paid in full at time of sale"
            />
            <StatCard
              label="Credit sales"
              value={formatMoney(data.creditSales)}
              icon={<Handshake />}
              description="Left partial or unpaid"
            />
            <StatCard
              label="Payments collected"
              value={formatMoney(data.paymentsCollected)}
              icon={<HandCoins />}
              description="Includes debt collected from prior sales"
            />
          </div>
          {data.salesCount === 0 ? (
            <p className="text-sm text-muted-foreground">No completed sales on this date.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
