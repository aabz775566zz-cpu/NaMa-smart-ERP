'use client';

import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
      <MobileNav />
      <div className="flex-1" />
      <UserMenu />
    </header>
  );
}
