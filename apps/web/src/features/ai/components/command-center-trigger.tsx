'use client';

import { Button } from '@erp-smart/ui';
import { Sparkles } from 'lucide-react';

import { useCommandCenter } from '@/lib/command-center';
import { useLocale } from '@/lib/locale/locale-context';

// Safe to read navigator directly, no useEffect/useState needed: this
// button only ever mounts client-side, after DashboardLayout's auth gate
// resolves (apps/web/src/app/dashboard/layout.tsx) — there is no
// server-rendered markup for it to hydrate against, so no mismatch risk.
function getShortcutHint(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return isMac ? '⌘K' : 'Ctrl+K';
}

export function CommandCenterTrigger() {
  const { open } = useCommandCenter();
  const { messages } = useLocale();

  return (
    <Button variant="outline" size="sm" onClick={() => open()} className="gap-2">
      {/* Iris marks AI presence, never Saffron — Constitution ch.7/15. This is
          the product's always-visible "the machine can think with you" cue. */}
      <Sparkles className="h-4 w-4 text-accent-brand" />
      <span className="hidden sm:inline">{messages.ai.askAiLabel}</span>
      <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground sm:inline-block">
        {getShortcutHint()}
      </kbd>
    </Button>
  );
}
