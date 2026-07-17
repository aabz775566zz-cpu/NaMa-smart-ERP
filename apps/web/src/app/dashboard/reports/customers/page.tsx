'use client';

import { EmptyState } from '@erp-smart/ui';
import { ShieldAlert } from 'lucide-react';

import { CustomersReportView } from '@/features/reports/components/customers-report-view';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function CustomerReportPage() {
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
        <h1 className="text-xl font-semibold text-foreground">{messages.nav.customerReports}</h1>
        <p className="text-sm text-muted-foreground">{messages.reports.subtitle}</p>
      </div>
      <CustomersReportView />
    </div>
  );
}
