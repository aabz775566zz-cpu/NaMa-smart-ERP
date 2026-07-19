'use client';

import { getDirection } from '@erp-smart/i18n';
import { Badge, Skeleton } from '@erp-smart/ui';
import Link from 'next/link';

import { useInvoices } from '@/features/invoices/hooks';
import { isInvoiceOverdue } from '@/features/invoices/overdue';
import { useDashboardReport } from '@/features/reports/hooks';
import { useCompany } from '@/features/settings/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';
import { useCurrentUser, usePermissions } from '@/lib/store';

function useGreetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  // Computed once per mount, not re-evaluated on a timer — a greeting that
  // flips under the user mid-session would be more distracting than useful.
  const hour = new Date().getHours();
  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';
  return 'goodEvening';
}

/** The one-sentence "Am I okay?" answer, in words before any widget:
 * revenue pacing vs the same point last month, plus a chip that either says
 * all-clear or counts what needs attention (linked to the attention list).
 * Only mounted for users with REPORTS:READ — the hook fires on mount. */
function BriefingStatus() {
  const { messages } = useLocale();
  const t = messages.dashboard;
  const formatMoney = useFormatMoney();
  const permissions = usePermissions();
  const canViewInvoices = permissions.includes('INVOICES:READ');

  const { data, isLoading } = useDashboardReport();
  // Shares the query key (and therefore the single fetch) with AttentionList.
  const invoicesQuery = useInvoices('ISSUED', { enabled: canViewInvoices });

  if (isLoading) return <Skeleton className="h-5 w-72 max-w-full" />;
  if (!data) return null;

  const revenue = Number(data.revenueThisMonth);
  const previous = Number(data.revenuePreviousMonth);

  let trend: string;
  if (previous <= 0) {
    trend = revenue > 0 ? t.trendNoBaseline : t.trendFlat;
  } else {
    const deltaPercent = ((revenue - previous) / previous) * 100;
    if (Math.abs(deltaPercent) < 1) trend = t.trendFlat;
    else if (deltaPercent > 0) trend = t.trendUp.replace('{{percent}}', String(Math.round(deltaPercent)));
    else trend = t.trendDown.replace('{{percent}}', String(Math.round(Math.abs(deltaPercent))));
  }

  const overdueCount = canViewInvoices
    ? (invoicesQuery.data ?? []).filter((invoice) => isInvoiceOverdue(invoice)).length
    : 0;
  const attentionCount = data.lowStockCount + overdueCount;
  const allClear = attentionCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${allClear ? 'bg-success' : 'bg-warning'}`}
          aria-hidden="true"
        />
        {t.statusRevenueLine.replace('{{amount}}', formatMoney(data.revenueThisMonth)).replace('{{trend}}', trend)}
      </span>
      <Link
        href="#attention"
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
          allClear
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/15'
        }`}
      >
        {allClear ? t.allClearChip : t.attentionChip.replace('{{count}}', String(attentionCount))}
      </Link>
    </div>
  );
}

export function BriefingHeader() {
  const user = useCurrentUser();
  const permissions = usePermissions();
  const { data: company } = useCompany();
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const roleLabels = useRoleLabels();
  const greetingKey = useGreetingKey();
  const canViewReports = permissions.includes('REPORTS:READ');

  const today = new Intl.DateTimeFormat(direction === 'rtl' ? 'ar' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{messages.dashboard[greetingKey]}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {company?.name ?? messages.dashboard.welcomeBack}
          </h1>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          {user ? <Badge variant="outline">{roleLabels[user.roleKey]}</Badge> : null}
          <span>{today}</span>
        </div>
      </div>
      {canViewReports ? <BriefingStatus /> : null}
    </div>
  );
}
