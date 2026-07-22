'use client';

import { Sidebar } from '@erp-smart/ui';

import { CommandCenter } from '@/features/ai/components/command-center';
import { useCommandCenterShortcut } from '@/lib/command-center';

import { DashboardHeader } from './header';
import { DashboardSidebarNav } from './sidebar-nav';
import { VerificationBanner } from './verification-banner';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  useCommandCenterShortcut();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar className="hidden md:flex">
        <DashboardSidebarNav />
      </Sidebar>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Golden Night ambience, dark mode only — a fine dot-grid (the
            quiet depth cue Linear/Vercel-style shells use) under a Saffron
            bloom bleeding from the top edge, the room's lamplight. Both
            pointer-transparent and behind content; invisible in Bone
            daylight, never a decoration layer there. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-0 dark:opacity-100 bg-[radial-gradient(hsl(var(--foreground)/0.06)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_40%,transparent_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 opacity-0 transition-opacity duration-500 dark:opacity-100 bg-[radial-gradient(55%_100%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]"
        />
        <DashboardHeader />
        <VerificationBanner />
        {/* Bounded content column: wide monitors get a calm, centred reading
            width instead of edge-to-edge sprawl. min-h-full + flex-col lets
            full-height pages (AI chat) use flex-1 to fill the viewport while
            long pages still scroll naturally. */}
        <main className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col p-6 sm:p-8">{children}</div>
        </main>
      </div>
      <CommandCenter />
    </div>
  );
}
