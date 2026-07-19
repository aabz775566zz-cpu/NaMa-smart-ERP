'use client';

import { Card, EmptyState, Skeleton, Sparkline } from '@erp-smart/ui';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import Link from 'next/link';

import { useDashboardReport } from '@/features/reports/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

/** Compact ↑12% / ↓8% / — badge comparing a value to its previous-window
 * baseline. Neutral when flat, "New" when there is no baseline yet — never
 * a fake 100%. Colour: growth = success, decline = destructive (money
 * truth), never brand Saffron. */
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const { messages } = useLocale();
  const t = messages.dashboard;

  if (previous <= 0) {
    if (current <= 0) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {t.newBaseline}
      </span>
    );
  }

  const deltaPercent = ((current - previous) / previous) * 100;
  const flat = Math.abs(deltaPercent) < 1;
  const up = deltaPercent > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        flat ? 'bg-muted text-muted-foreground' : up ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      }`}
    >
      {flat ? <Minus className="h-3 w-3" /> : up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {flat ? null : `${Math.round(Math.abs(deltaPercent))}%`}
    </span>
  );
}

/**
 * The briefing's single metrics surface: revenue leads (big number + trend +
 * 14-day sparkline), with a compact rail for the three numbers a business
 * owner actually checks daily — sales pace, money owed to them, and stock
 * risk. Replaces the old five-tile strip whose "total customers / active
 * products" cells never changed day to day.
 */
export function RevenueHero() {
  const { data, isLoading, isError, error } = useDashboardReport();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.dashboard;
  const tr = messages.reports;

  if (isLoading) {
    return (
      <Card className="grid grid-cols-1 gap-px overflow-hidden bg-border p-0 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-none lg:col-span-2" />
        <Skeleton className="h-48 rounded-none" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title={tr.couldNotLoadOverview}
        description={error instanceof Error ? error.message : messages.common.pleaseTryAgain}
      />
    );
  }

  const sparkValues = data.dailyRevenue.map((entry) => Number(entry.revenue));

  const railItems = [
    {
      key: 'sales',
      label: tr.salesThisMonth,
      value: String(data.salesCountThisMonth),
      href: '/dashboard/sales',
      badge: <TrendBadge current={data.salesCountThisMonth} previous={data.salesCountPreviousMonth} />,
      warn: false,
    },
    {
      key: 'receivables',
      label: t.owedToYou,
      value: formatMoney(data.receivablesOutstanding),
      href: '/dashboard/customers',
      badge: null,
      warn: false,
    },
    {
      key: 'lowStock',
      label: tr.lowStockItems,
      value: String(data.lowStockCount),
      href: '/dashboard/inventory',
      badge: null,
      warn: data.lowStockCount > 0,
    },
  ];

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden p-0 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <Link
          href="/dashboard/reports"
          className="group flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-muted/30 lg:col-span-2"
        >
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tr.revenueThisMonth}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {formatMoney(data.revenueThisMonth)}
              </span>
              <TrendBadge current={Number(data.revenueThisMonth)} previous={Number(data.revenuePreviousMonth)} />
            </div>
            <p className="text-xs text-muted-foreground">{t.vsLastMonth}</p>
          </div>
          <div className="space-y-1.5">
            <Sparkline values={sparkValues} className="h-12 text-primary" />
            <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground/70">{t.last14Days}</p>
          </div>
        </Link>

        <div className="flex flex-col divide-y divide-border border-t border-border lg:border-s lg:border-t-0">
          {railItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex flex-1 items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p
                  className={`mt-0.5 truncate text-xl font-bold tabular-nums tracking-tight ${
                    item.warn ? 'text-warning' : 'text-foreground'
                  }`}
                >
                  {item.value}
                </p>
              </div>
              {item.badge}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
