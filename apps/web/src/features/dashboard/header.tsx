'use client';

import { usePathname } from 'next/navigation';

import { CommandCenterTrigger } from '@/features/ai/components/command-center-trigger';

import { useLocale } from '@/lib/locale/locale-context';

import { LanguageSwitcher } from './language-switcher';
import { MobileNav } from './mobile-nav';
import { findActiveNavLabelKey } from './nav-items';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

export function DashboardHeader() {
  const pathname = usePathname();
  const { messages } = useLocale();

  // Where-am-I context. Routes not in the nav (e.g. /dashboard/profile)
  // simply show nothing — better silence than a wrong label.
  const labelKey = findActiveNavLabelKey(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
      <MobileNav />
      {labelKey ? (
        <h2 className="truncate text-sm font-semibold text-foreground">{messages.nav[labelKey]}</h2>
      ) : null}
      <div className="flex-1" />
      <CommandCenterTrigger />
      <LanguageSwitcher />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
