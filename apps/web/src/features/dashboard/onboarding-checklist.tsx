'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { Check, Circle } from 'lucide-react';
import Link from 'next/link';

import { useCustomers } from '@/features/customers/hooks';
import { useProducts } from '@/features/products/hooks';
import { useMembers } from '@/features/settings/hooks';
import { useSales } from '@/features/sales/hooks';
import { usePermissions } from '@/lib/store';

interface ChecklistStep {
  label: string;
  href: string;
  done: boolean;
}

// Exported so the dashboard page can decide its grid layout (e.g. give the
// "Explore" panel the full row) without duplicating this permission check.
export function useOnboardingChecklistVisible() {
  const permissions = usePermissions();
  return (
    permissions.includes('PRODUCTS:READ') &&
    permissions.includes('CUSTOMERS:READ') &&
    permissions.includes('SALES:READ') &&
    permissions.includes('USERS:READ')
  );
}

// Completion is derived entirely from data that already exists (products,
// customers, sales, members) — no dedicated onboarding-progress backend
// model. Only shown to roles that can read all four resources (OWNER/
// MANAGER in practice), since it's meaningless to a restricted role who
// can't see whether a step is actually done.
export function OnboardingChecklist() {
  const canSeeChecklist = useOnboardingChecklistVisible();

  const { data: products } = useProducts({ enabled: canSeeChecklist });
  const { data: customers } = useCustomers({ enabled: canSeeChecklist });
  const { data: sales } = useSales(undefined, { enabled: canSeeChecklist });
  const { data: members } = useMembers({ enabled: canSeeChecklist });

  if (!canSeeChecklist) return null;
  if (!products || !customers || !sales || !members) return null;

  const steps: ChecklistStep[] = [
    { label: 'Create your first product', href: '/dashboard/products', done: products.length > 0 },
    { label: 'Create your first customer', href: '/dashboard/customers', done: customers.length > 0 },
    { label: 'Create your first sale', href: '/dashboard/sales', done: sales.length > 0 },
    { label: 'Invite a team member', href: '/dashboard/settings', done: members.length > 1 },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);

  if (doneCount === steps.length) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-2 py-4 text-sm font-medium text-foreground">
          <Check className="h-4 w-4 text-primary" />
          You&apos;re all set up — nice work getting started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Get started</CardTitle>
          <span className="text-sm text-muted-foreground">{percent}% complete</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.href + step.label}
            href={step.href}
            className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary"
          >
            {step.done ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={step.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
              {step.label}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
