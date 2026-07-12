'use client';

import { Card, CardHeader, CardTitle } from '@erp-smart/ui';
import Link from 'next/link';

import { DashboardReportView } from '@/features/reports/components/dashboard-report-view';
import { DASHBOARD_NAV_ITEMS } from '@/features/dashboard/nav-items';
import { useCompany } from '@/features/settings/hooks';
import { useCurrentUser, usePermissions } from '@/lib/store';

export default function DashboardHomePage() {
  const user = useCurrentUser();
  const permissions = usePermissions();
  const { data: company } = useCompany();
  const canViewReports = permissions.includes('REPORTS:READ');

  const quickLinks = DASHBOARD_NAV_ITEMS.filter(
    (item) => item.href !== '/dashboard' && (!item.requiredPermission || permissions.includes(item.requiredPermission)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Welcome back{company?.name ? `, ${company.name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.email} · {user?.roleKey}
        </p>
      </div>

      {canViewReports ? <DashboardReportView /> : null}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Quick links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <item.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{item.label}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
