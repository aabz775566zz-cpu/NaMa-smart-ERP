'use client';

import { EmptyState } from '@erp-smart/ui';
import { ShieldAlert } from 'lucide-react';

import { DailyCloseReportView } from '@/features/reports/components/daily-close-report-view';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

// "Financial" maps to the daily-close report — the financial end-of-day summary
// (revenue, payments, cash position) rendered by DailyCloseReportView from
// /reports/daily-close.
export default function FinancialReportPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('REPORTS:READ');
  const { messages } = useLocale();

  if (!canRead) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<ShieldAlert />}
          title={messages.common.accessDeniedTitle}
          description={messages.common.accessDeniedDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{messages.nav.financialReports}</h1>
        <p className="text-sm text-muted-foreground">{messages.reports.subtitle}</p>
      </div>
      <DailyCloseReportView />
    </div>
  );
}
