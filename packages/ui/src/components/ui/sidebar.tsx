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

// Groups a section of nav items under an optional label — purely visual
// spacing/sectioning, no knowledge of what belongs in which group (feature
// layer decides that, see apps/web/src/features/dashboard/nav-items.ts).
const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />,
);
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70', className)}
      {...props}
    />
  ),
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

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
          'relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
          'hover:bg-accent hover:text-accent-foreground',
          'data-[active]:bg-primary/10 data-[active]:text-primary data-[active]:hover:bg-primary/10 data-[active]:hover:text-primary',
          // Left (logical: start-edge) accent bar on the active item, on top of the tint.
          "data-[active]:before:absolute data-[active]:before:inset-y-1 data-[active]:before:start-0 data-[active]:before:w-0.5 data-[active]:before:rounded-full data-[active]:before:bg-primary data-[active]:before:content-['']",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarNavItem.displayName = 'SidebarNavItem';

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarNavItem,
};
