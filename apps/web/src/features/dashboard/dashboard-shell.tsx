'use client';

import { Sidebar } from '@erp-smart/ui';

import { DashboardHeader } from './header';
import { DashboardSidebarNav } from './sidebar-nav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar className="hidden md:flex">
        <DashboardSidebarNav />
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
