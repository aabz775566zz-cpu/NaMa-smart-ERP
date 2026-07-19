'use client';

import { AiCommandBar } from '@/features/dashboard/ai-command-bar';
import { AttentionList } from '@/features/dashboard/attention-list';
import { BriefingHeader } from '@/features/dashboard/briefing-header';
import { QuickActions } from '@/features/dashboard/quick-actions';
import { RevenueHero } from '@/features/dashboard/revenue-hero';
import { SetupProgressCard, useSetupProgressVisible } from '@/features/dashboard/setup-progress-card';
import { TodayCard } from '@/features/dashboard/today-card';
import { usePermissions } from '@/lib/store';

/**
 * The home screen is a daily business briefing, not a dashboard. Reading
 * order is the owner's three questions, top to bottom:
 *   Am I okay?            → BriefingHeader status line + RevenueHero
 *   What needs attention? → AttentionList (anchored, linked from the status chip)
 *   What should I do next?→ AiCommandBar (ask), QuickActions (act), TodayCard
 */
export default function DashboardHomePage() {
  const permissions = usePermissions();
  const canViewReports = permissions.includes('REPORTS:READ');
  const showSetupProgress = useSetupProgressVisible();

  return (
    <div className="space-y-8">
      <BriefingHeader />

      <AiCommandBar />

      <QuickActions />

      {canViewReports ? <RevenueHero /> : null}

      <div id="attention" className="grid scroll-mt-6 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionList />
        </div>
        <div className="flex flex-col gap-6">
          {canViewReports ? <TodayCard /> : null}
          {showSetupProgress ? <SetupProgressCard /> : null}
        </div>
      </div>
    </div>
  );
}
