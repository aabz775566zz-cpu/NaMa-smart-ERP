'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { DASHBOARD_NAV_ITEMS } from '@/features/dashboard/nav-items';
import { OnboardingChecklist, useOnboardingChecklistVisible } from '@/features/dashboard/onboarding-checklist';
import { DashboardReportView } from '@/features/reports/components/dashboard-report-view';
import { useCompany } from '@/features/settings/hooks';
import { useCurrentUser, usePermissions } from '@/lib/store';

export default function DashboardHomePage() {
  const user = useCurrentUser();
  const permissions = usePermissions();
  const { data: company } = useCompany();
  const canViewReports = permissions.includes('REPORTS:READ');
  const showChecklist = useOnboardingChecklistVisible();

  const quickLinks = DASHBOARD_NAV_ITEMS.filter(
    (item) => item.href !== '/dashboard' && (!item.requiredPermission || permissions.includes(item.requiredPermission)),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back{company?.name ? `, ${company.name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.email} · {user?.roleKey}
        </p>
      </div>

      {canViewReports ? <DashboardReportView /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {showChecklist ? (
          <div className="lg:col-span-3">
            <OnboardingChecklist />
          </div>
        ) : null}
        <Card className={showChecklist ? 'lg:col-span-2' : 'lg:col-span-5'}>
          <CardHeader>
            <CardTitle className="text-base">Explore</CardTitle>
          </CardHeader>
          <CardContent className={showChecklist ? 'space-y-1' : 'grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3'}>
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <item.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
