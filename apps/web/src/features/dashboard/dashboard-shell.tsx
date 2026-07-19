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
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <VerificationBanner />
        {/* Bounded content column: wide monitors get a calm, centred reading
            width instead of edge-to-edge sprawl. min-h-full + flex-col lets
            full-height pages (AI chat) use flex-1 to fill the viewport while
            long pages still scroll naturally. */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col p-6 sm:p-8">{children}</div>
        </main>
      </div>
      <CommandCenter />
    </div>
  );
}
