'use client';

import { getDirection } from '@erp-smart/i18n';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { ArrowRight, Check, Circle } from 'lucide-react';
import Link from 'next/link';

import { useCustomers } from '@/features/customers/hooks';
import { useProducts } from '@/features/products/hooks';
import { useMembers } from '@/features/settings/hooks';
import { useSales } from '@/features/sales/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

interface SetupStep {
  label: string;
  href: string;
  done: boolean;
}

// Exported so the dashboard page can decide its grid layout without
// duplicating this permission check.
export function useSetupProgressVisible() {
  const permissions = usePermissions();
  return (
    permissions.includes('PRODUCTS:READ') &&
    permissions.includes('CUSTOMERS:READ') &&
    permissions.includes('SALES:READ') &&
    permissions.includes('USERS:READ')
  );
}

// Completion is derived entirely from data that already exists (products,
// customers, sales, members) — no dedicated setup-progress backend model.
// Only shown to roles that can read all four resources (OWNER/MANAGER in
// practice), since it's meaningless to a restricted role who can't see
// whether a step is actually done.
export function SetupProgressCard() {
  const canSeeProgress = useSetupProgressVisible();
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const t = messages.dashboard;

  const { data: products } = useProducts({ enabled: canSeeProgress });
  const { data: customers } = useCustomers({ enabled: canSeeProgress });
  const { data: sales } = useSales(undefined, { enabled: canSeeProgress });
  const { data: members } = useMembers({ enabled: canSeeProgress });

  if (!canSeeProgress) return null;
  if (!products || !customers || !sales || !members) return null;

  const steps: SetupStep[] = [
    { label: t.stepCreateProduct, href: '/dashboard/products', done: products.length > 0 },
    { label: t.stepCreateCustomer, href: '/dashboard/customers', done: customers.length > 0 },
    { label: t.stepCreateSale, href: '/dashboard/sales', done: sales.length > 0 },
    { label: t.stepInviteMember, href: '/dashboard/settings', done: members.length > 1 },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done);

  if (doneCount === steps.length) {
    return (
      <Card className="flex flex-col justify-center border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-3 py-6 text-sm font-medium text-foreground">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-5 w-5" />
          </div>
          {t.allSetUp}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t.setupProgressTitle}</CardTitle>
          <span className="text-sm font-semibold text-primary">
            {t.percentComplete.replace('{{percent}}', String(percent))}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.href + step.label}>
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/60"
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
            </li>
          ))}
        </ul>
        {nextStep ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={nextStep.href}>
              {t.continueSetup}
              <ArrowRight className={direction === 'rtl' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
