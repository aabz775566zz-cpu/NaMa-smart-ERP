import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * Domain-agnostic app-shell sidebar primitives — no knowledge of routes,
 * modules, or permissions. Feature layers compose these with their own nav
 * data (see apps/web/src/features/dashboard).
 */
const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn('flex h-full w-64 shrink-0 flex-col border-e border-border bg-card', className)}
      {...props}
    />
  ),
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex h-14 shrink-0 items-center gap-2 border-b border-border px-4', className)} {...props} />
  ),
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex-1 overflow-y-auto p-2', className)} {...props} />,
);
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('shrink-0 border-t border-border p-2', className)} {...props} />,
);
SidebarFooter.displayName = 'SidebarFooter';

const SidebarNav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => <nav ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />,
);
SidebarNav.displayName = 'SidebarNav';

export interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  active?: boolean;
}

const SidebarNavItem = React.forwardRef<HTMLButtonElement, SidebarNavItemProps>(
  ({ className, asChild = false, active = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        data-active={active || undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
          'hover:bg-accent hover:text-accent-foreground',
          'data-[active]:bg-primary/10 data-[active]:text-primary data-[active]:hover:bg-primary/10 data-[active]:hover:text-primary',
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarNavItem.displayName = 'SidebarNavItem';

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarNav, SidebarNavItem };
