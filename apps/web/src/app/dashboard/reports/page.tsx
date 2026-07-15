'use client';

import { EmptyState } from '@erp-smart/ui';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

import { CustomersReportView } from '@/features/reports/components/customers-report-view';
import { DailyCloseReportView } from '@/features/reports/components/daily-close-report-view';
import { DashboardReportView } from '@/features/reports/components/dashboard-report-view';
import { InventoryReportView } from '@/features/reports/components/inventory-report-view';
import { ProductsReportView } from '@/features/reports/components/products-report-view';
import type { ReportSection } from '@/features/reports/components/report-nav';
import { ReportNav } from '@/features/reports/components/report-nav';
import { SalesReportView } from '@/features/reports/components/sales-report-view';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function ReportsPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('REPORTS:READ');
  const [section, setSection] = useState<ReportSection>('overview');
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
        <h1 className="text-xl font-semibold text-foreground">{messages.reports.title}</h1>
        <p className="text-sm text-muted-foreground">{messages.reports.subtitle}</p>
      </div>

      <ReportNav active={section} onChange={setSection} />

      {section === 'overview' ? <DashboardReportView /> : null}
      {section === 'daily-close' ? <DailyCloseReportView /> : null}
      {section === 'sales' ? <SalesReportView /> : null}
      {section === 'products' ? <ProductsReportView /> : null}
      {section === 'customers' ? <CustomersReportView /> : null}
      {section === 'inventory' ? <InventoryReportView /> : null}
    </div>
  );
}
