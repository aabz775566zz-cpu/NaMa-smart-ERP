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
        {/* Golden Night ambience: a faint Saffron bloom bleeding from the top
            edge, dark mode only — the room's lamplight, never a decoration
            layer in Bone daylight. Pointer-transparent and behind content. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 opacity-0 transition-opacity duration-500 dark:opacity-100 bg-[radial-gradient(55%_100%_at_50%_0%,hsl(var(--primary)/0.09),transparent_70%)]"
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
