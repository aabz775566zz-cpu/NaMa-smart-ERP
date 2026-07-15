'use client';

import { getDirection } from '@erp-smart/i18n';
import { Badge, Button, Card, CardContent } from '@erp-smart/ui';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, CheckCircle2, Construction } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';

/**
 * The single shared placeholder for every module that has navigation but no
 * implementation yet (see the Phase 8 navigation-skeleton work). Feature
 * pages never build their own "coming soon" screen — they render this with
 * their own icon/title/description/capabilities so every unfinished corner
 * of the app looks and behaves identically.
 */
export function UnderDevelopmentPage({
  icon: Icon,
  title,
  description,
  capabilities,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  capabilities: string[];
}) {
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const t = messages.comingSoon;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-lg overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <CardContent className="flex flex-col items-center gap-5 px-8 py-10 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-10 w-10" />
            <span className="absolute -end-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card text-warning ring-4 ring-card">
              <Construction className="h-4 w-4" />
            </span>
          </div>

          <Badge variant="warning" className="uppercase tracking-wide">
            {t.badge}
          </Badge>

          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{t.heading}</p>
          </div>

          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>

          <div className="w-full space-y-2.5 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t.capabilitiesHeading}
            </p>
            <ul className="space-y-2">
              {capabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">{t.subtext}</p>

          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className={direction === 'rtl' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
              {t.backToDashboard}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
