'use client';

import { Button, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@erp-smart/ui';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { DashboardSidebarNav } from './sidebar-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { messages } = useLocale();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{messages.dashboard.openMenu}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="start" className="w-64 p-0">
        <SheetTitle className="sr-only">{messages.dashboard.navigationLabel}</SheetTitle>
        <DashboardSidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
