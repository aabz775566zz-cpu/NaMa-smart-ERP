'use client';

import { brandConfig } from '@erp-smart/branding';
import {
  cn,
  Logo,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarNavSubmenu,
} from '@erp-smart/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

import {
  CUSTOMERS_NAV_ITEM,
  DASHBOARD_AI_ITEM,
  DASHBOARD_COMING_SOON_SECTION,
  DASHBOARD_HOME_ITEM,
  DASHBOARD_NAV_SECTIONS,
  DASHBOARD_SETTINGS_SECTION,
  type DashboardNavLeaf,
  type DashboardNavSection,
} from './nav-items';

const ALL_SECTIONS = [...DASHBOARD_NAV_SECTIONS, DASHBOARD_SETTINGS_SECTION, DASHBOARD_COMING_SOON_SECTION];

/**
 * The nav list content only (no outer <aside>) so it can be reused inside
 * both the desktop Sidebar and the mobile Sheet drawer.
 *
 * Structure: real, shipped modules at full visual weight; every unbuilt
 * route collapsed into one muted "Coming soon" section at the very bottom.
 */
export function DashboardSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const permissions = usePermissions();
  const { messages } = useLocale();

  function isLeafActive(item: DashboardNavLeaf) {
    return item.href === '/dashboard' ? pathname === item.href : (pathname?.startsWith(item.href) ?? false);
  }

  function isSectionActive(section: DashboardNavSection) {
    return section.items.some(isLeafActive);
  }

  // Every section that contains the current route starts expanded; the rest
  // start collapsed. Re-derives whenever the route changes so navigating
  // (including via browser back/forward) keeps the right section open.
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(ALL_SECTIONS.filter(isSectionActive).map((section) => section.labelKey)),
  );

  useEffect(() => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const section of ALL_SECTIONS) {
        if (isSectionActive(section)) next.add(section.labelKey);
      }
      return next;
    });
    // Only the route should trigger auto-expansion — toggling a section by
    // hand must not be undone by this effect re-running for other reasons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleSection(labelKey: string, open: boolean) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (open) next.add(labelKey);
      else next.delete(labelKey);
      return next;
    });
  }

  function renderLeaf(item: DashboardNavLeaf, indented = false) {
    const active = isLeafActive(item);
    return (
      <SidebarNavItem
        key={item.href}
        asChild
        active={active}
        className={cn(indented && 'py-1.5 text-[0.8125rem] font-normal')}
      >
        <Link href={item.href} onClick={onNavigate}>
          {/* Iris marks AI presence even when the item is active — the AI
              entry never wears Saffron (Constitution ch.7/15). */}
          {!indented ? <item.icon className={item.accent ? '!text-accent-brand' : undefined} /> : null}
          <span className="flex-1 truncate text-start">{messages.nav[item.labelKey]}</span>
        </Link>
      </SidebarNavItem>
    );
  }

  function renderSection(section: DashboardNavSection, options?: { muted?: boolean }) {
    const visibleItems = section.items.filter(
      (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
    );
    if (visibleItems.length === 0) return null;

    const active = isSectionActive(section);

    return (
      <div
        key={section.labelKey}
        className={cn(
          // The whole Coming-soon section is quiet by design; it wakes up
          // only while the user is actually inside one of its routes.
          options?.muted &&
            !active &&
            '[&_a]:text-muted-foreground/50 [&_a:hover]:text-muted-foreground [&_button]:text-muted-foreground/50 [&_button:hover]:text-muted-foreground',
        )}
      >
        <SidebarNavSubmenu
          icon={<section.icon />}
          label={messages.nav[section.labelKey]}
          active={active}
          open={openSections.has(section.labelKey)}
          onOpenChange={(open) => toggleSection(section.labelKey, open)}
        >
          {visibleItems.map((item) => renderLeaf(item, true))}
        </SidebarNavSubmenu>
      </div>
    );
  }

  return (
    <>
      <SidebarHeader>
        <Logo wordmark={brandConfig.productName} markSize={24} wordmarkClassName="text-sm" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav>
          {renderLeaf(DASHBOARD_HOME_ITEM)}
          {renderLeaf(DASHBOARD_AI_ITEM)}
          {DASHBOARD_NAV_SECTIONS.map((section) => renderSection(section))}
          {permissions.includes('CUSTOMERS:READ') ? renderLeaf(CUSTOMERS_NAV_ITEM) : null}
          {renderSection(DASHBOARD_SETTINGS_SECTION)}
          <div className="my-2 border-t border-border/60" />
          {renderSection(DASHBOARD_COMING_SOON_SECTION, { muted: true })}
        </SidebarNav>
      </SidebarContent>
    </>
  );
}
