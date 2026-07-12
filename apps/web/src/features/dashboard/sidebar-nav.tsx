'use client';

import { brandConfig } from '@erp-smart/branding';
import { SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from '@erp-smart/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { usePermissions } from '@/lib/store';

import { DASHBOARD_NAV_ITEMS } from './nav-items';

/**
 * The nav list content only (no outer <aside>) so it can be reused inside
 * both the desktop Sidebar and the mobile Sheet drawer.
 */
export function DashboardSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const permissions = usePermissions();

  const visibleItems = DASHBOARD_NAV_ITEMS.filter(
    (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
  );

  return (
    <>
      <SidebarHeader>
        <span className="truncate text-sm font-semibold text-foreground">{brandConfig.productName}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav>
          {visibleItems.map((item) => {
            const active = item.href === '/dashboard' ? pathname === item.href : (pathname?.startsWith(item.href) ?? false);
            return (
              <SidebarNavItem key={item.href} asChild active={active}>
                <Link href={item.href} onClick={onNavigate}>
                  <item.icon />
                  {item.label}
                </Link>
              </SidebarNavItem>
            );
          })}
        </SidebarNav>
      </SidebarContent>
    </>
  );
}
