'use client';

import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@erp-smart/ui';
import { Activity, type LucideIcon } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';

// One real event once a feed exists: what happened, an icon for its type,
// and an already-formatted relative timestamp (so this component never
// needs to know about date-math/locale formatting itself).
export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  description: string;
  timestamp: string;
}

// No backend feed exists yet for cross-module activity (sales, invoices,
// customers, inventory) — the `activities` prop is intentionally already
// shaped for when one does, but is never populated with invented data in
// the meantime. Until then this always renders the empty state below.
export function RecentActivityCard({ activities = [] }: { activities?: ActivityItem[] }) {
  const { messages } = useLocale();
  const t = messages.dashboard;

  return (
    <Card className="flex min-h-[26rem] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.recentActivity}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {activities.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <EmptyState
              icon={<Activity />}
              title={t.noActivityTitle}
              description={t.noActivityDescription}
              className="border-none"
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {activities.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
