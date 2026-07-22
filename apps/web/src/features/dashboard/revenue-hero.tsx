'use client';

import { AreaChart, Card, EmptyState, Skeleton } from '@erp-smart/ui';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, HandCoins, Minus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

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
  const sparkLabels = data.dailyRevenue.map((entry) =>
    new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(entry.date)),
  );

  const railItems: {
    key: string;
    label: string;
    value: string;
    href: string;
    badge: React.ReactNode;
    icon: LucideIcon;
    tone: 'primary' | 'info' | 'warning';
  }[] = [
    {
      key: 'sales',
      label: tr.salesThisMonth,
      value: String(data.salesCountThisMonth),
      href: '/dashboard/sales',
      badge: <TrendBadge current={data.salesCountThisMonth} previous={data.salesCountPreviousMonth} />,
      icon: ShoppingCart,
      tone: 'primary',
    },
    {
      key: 'receivables',
      label: t.owedToYou,
      value: formatMoney(data.receivablesOutstanding),
      href: '/dashboard/customers',
      badge: null,
      icon: HandCoins,
      tone: 'info',
    },
    {
      key: 'lowStock',
      label: tr.lowStockItems,
      value: String(data.lowStockCount),
      href: '/dashboard/inventory',
      badge: null,
      icon: AlertTriangle,
      tone: data.lowStockCount > 0 ? 'warning' : 'info',
    },
  ];

  const toneClasses: Record<(typeof railItems)[number]['tone'], string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
  };

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
              {/* In Golden Night the number itself is the lamp — a soft
                  Saffron halo behind the month's revenue. */}
              <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground dark:[text-shadow:0_0_28px_hsl(var(--primary)/0.35)]">
                {formatMoney(data.revenueThisMonth)}
              </span>
              <TrendBadge current={Number(data.revenueThisMonth)} previous={Number(data.revenuePreviousMonth)} />
            </div>
            <p className="text-xs text-muted-foreground">{t.vsLastMonth}</p>
          </div>
          <div className="space-y-1">
            <AreaChart
              values={sparkValues}
              labels={sparkLabels}
              className="text-primary dark:drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]"
            />
            <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground/70">{t.last14Days}</p>
          </div>
        </Link>

        <div className="flex flex-col divide-y divide-border border-t border-border lg:border-s lg:border-t-0">
          {railItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex flex-1 items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/40"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[item.tone]}`}>
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p
                  className={`mt-0.5 truncate text-xl font-bold tabular-nums tracking-tight ${
                    item.tone === 'warning' ? 'text-warning' : 'text-foreground'
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
