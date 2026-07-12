'use client';

import { brandConfig } from '@erp-smart/branding';
import {
  Logo,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
} from '@erp-smart/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

import { DASHBOARD_NAV_ITEMS, NAV_GROUP_LABEL_KEYS, type DashboardNavGroup, type DashboardNavItem } from './nav-items';

const CONTENT_GROUPS: DashboardNavGroup[] = ['overview', 'operations', 'insights'];

/**
 * The nav list content only (no outer <aside>) so it can be reused inside
 * both the desktop Sidebar and the mobile Sheet drawer.
 */
export function DashboardSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const permissions = usePermissions();
  const { messages } = useLocale();

  const visibleItems = DASHBOARD_NAV_ITEMS.filter(
    (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
  );
  const settingsItems = visibleItems.filter((item) => item.group === 'settings');

  function isActive(item: DashboardNavItem) {
    return item.href === '/dashboard' ? pathname === item.href : (pathname?.startsWith(item.href) ?? false);
  }

  function renderItem(item: DashboardNavItem) {
    return (
      <SidebarNavItem key={item.href} asChild active={isActive(item)}>
        <Link href={item.href} onClick={onNavigate}>
          <item.icon />
          {messages.nav[item.labelKey]}
        </Link>
      </SidebarNavItem>
    );
  }

  return (
    <>
      <SidebarHeader>
        <Logo wordmark={brandConfig.productName} markSize={24} wordmarkClassName="text-sm" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav>
          {CONTENT_GROUPS.map((group) => {
            const items = visibleItems.filter((item) => item.group === group);
            if (items.length === 0) return null;
            return (
              <SidebarGroup key={group}>
                {group !== 'overview' ? (
                  <SidebarGroupLabel>{messages.nav[NAV_GROUP_LABEL_KEYS[group]]}</SidebarGroupLabel>
                ) : null}
                {items.map(renderItem)}
              </SidebarGroup>
            );
          })}
        </SidebarNav>
      </SidebarContent>
      {settingsItems.length > 0 ? (
        <SidebarFooter>
          <SidebarNav>{settingsItems.map(renderItem)}</SidebarNav>
        </SidebarFooter>
      ) : null}
    </>
  );
}
