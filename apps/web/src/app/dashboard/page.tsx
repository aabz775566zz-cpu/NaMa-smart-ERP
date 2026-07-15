'use client';

import { getDirection } from '@erp-smart/i18n';
import { Badge } from '@erp-smart/ui';

import { AiAssistantCard } from '@/features/dashboard/ai-assistant-card';
import { AttentionList } from '@/features/dashboard/attention-list';
import { KpiOverview } from '@/features/dashboard/kpi-overview';
import { QuickActions } from '@/features/dashboard/quick-actions';
import { SetupProgressCard, useSetupProgressVisible } from '@/features/dashboard/setup-progress-card';
import { useCompany } from '@/features/settings/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';
import { useCurrentUser, usePermissions } from '@/lib/store';

function useGreetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  // Computed once per mount, not re-evaluated on a timer — a greeting that
  // flips under the user mid-session would be more distracting than useful.
  // Safe from hydration mismatches: DashboardLayout never renders this
  // subtree during the initial (unauthenticated) server pass — it only
  // mounts client-side once the auth status resolves to 'authenticated'.
  const hour = new Date().getHours();
  if (hour < 12) return 'goodMorning';
  if (hour < 18) return 'goodAfternoon';
  return 'goodEvening';
}

export default function DashboardHomePage() {
  const user = useCurrentUser();
  const permissions = usePermissions();
  const { data: company } = useCompany();
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const roleLabels = useRoleLabels();
  const canViewReports = permissions.includes('REPORTS:READ');
  const showSetupProgress = useSetupProgressVisible();
  const greetingKey = useGreetingKey();

  const today = new Intl.DateTimeFormat(direction === 'rtl' ? 'ar' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-10">
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

      <QuickActions />

      {canViewReports ? <KpiOverview /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionList />
        </div>
        <div className="flex flex-col gap-6">
          {showSetupProgress ? <SetupProgressCard /> : null}
          <AiAssistantCard />
        </div>
      </div>
    </div>
  );
}
