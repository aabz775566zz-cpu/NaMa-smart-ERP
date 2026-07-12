'use client';

import { Button, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@erp-smart/ui';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { DashboardSidebarNav } from './sidebar-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="start" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <DashboardSidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
