'use client';

import { getDirection } from '@erp-smart/i18n';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@erp-smart/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useDailyCloseReport } from '@/features/reports/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

/**
 * "What happened today" — the daily-briefing counterpart to the monthly
 * hero: sales booked today and cash actually collected today (which
 * includes old debt paid down — deliberately a different question than
 * revenue, see ReportsService.getDailyCloseReport). Fails quiet: on error
 * the card simply doesn't render rather than adding an error surface to
 * the calm home screen — the full daily close page still reports loudly.
 */
export function TodayCard() {
  const { data, isLoading, isError } = useDailyCloseReport();
  const formatMoney = useFormatMoney();
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const t = messages.dashboard;

  if (isError) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.todayTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">{t.todaySales}</span>
              <span className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                {formatMoney(data.totalSales)}
                <span className="ms-1.5 text-xs font-medium text-muted-foreground">({data.salesCount})</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">{t.todayCollected}</span>
              <span className="text-lg font-bold tabular-nums tracking-tight text-success">
                {formatMoney(data.paymentsCollected)}
              </span>
            </div>
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary hover:underline"
            >
              {t.viewDailyClose}
              <ArrowRight className={direction === 'rtl' ? 'h-3 w-3 rotate-180' : 'h-3 w-3'} />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
