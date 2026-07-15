'use client';

import { getDirection } from '@erp-smart/i18n';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';

export function AiAssistantCard() {
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const t = messages.ai;

  return (
    <Card className="flex flex-col bg-gradient-to-br from-accent-brand/5 via-card to-card">
      <CardHeader className="space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-brand/10 text-accent-brand">
          <Sparkles className="h-5 w-5" />
        </div>
        <CardTitle className="text-base">{t.askAiAssistant}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t.dashboardCardDescription}</p>
        <Button asChild className="w-full">
          <Link href="/dashboard/ai">
            {t.openAssistant}
            <ArrowRight className={direction === 'rtl' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
