'use client';

import { Sparkles } from 'lucide-react';

import { useCommandCenter } from '@/lib/command-center';
import { useLocale } from '@/lib/locale/locale-context';

// Mirrors CommandCenterTrigger's platform detection — safe to read
// navigator directly since this only mounts client-side behind the auth gate.
function getShortcutHint(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return isMac ? '⌘K' : 'Ctrl+K';
}

/**
 * The centrepiece of the briefing: a full-width ask-bar that opens the
 * Command Center, with suggestion chips that open it pre-seeded with a real
 * question. Iris (accent-brand) marks it as an AI surface — the only violet
 * on the page, exactly per the Constitution's "Iris = intelligence present"
 * rule, and deliberately quiet: a tinted border and icon, not a violet slab.
 */
export function AiCommandBar() {
  const { open } = useCommandCenter();
  const { messages } = useLocale();
  const t = messages.dashboard;

  const suggestions = [t.aiSuggestionSales, t.aiSuggestionCustomers, t.aiSuggestionLowStock];

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => open()}
        className="group flex w-full items-center gap-3 rounded-xl border border-accent-brand/25 bg-gradient-to-r from-accent-brand/[0.06] via-card to-card px-4 py-3.5 text-start shadow-xs transition-all hover:border-accent-brand/45 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand/60 active:scale-[0.995]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-brand/12 text-accent-brand transition-colors group-hover:bg-accent-brand/18">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate text-sm text-muted-foreground">{t.aiBarPrompt}</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground sm:inline-block">
          {getShortcutHint()}
        </kbd>
      </button>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => open(suggestion)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent-brand/40 hover:text-foreground active:scale-[0.98]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
