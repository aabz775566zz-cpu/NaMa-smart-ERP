'use client';

import { brandConfig } from '@erp-smart/branding';
import {
  Badge,
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
  DASHBOARD_AI_ITEM,
  DASHBOARD_HOME_ITEM,
  DASHBOARD_NAV_SECTIONS,
  DASHBOARD_SETTINGS_SECTION,
  type DashboardNavLeaf,
  type DashboardNavSection,
} from './nav-items';

const ALL_SECTIONS = [...DASHBOARD_NAV_SECTIONS, DASHBOARD_SETTINGS_SECTION];

/**
 * The nav list content only (no outer <aside>) so it can be reused inside
 * both the desktop Sidebar and the mobile Sheet drawer.
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

  // Icons stay on section headers and the two standalone top-level items
  // (Dashboard, AI Assistant) — every nested child under a section already
  // has that section's icon for context, so repeating one on all ~40 leaf
  // items (most of them future placeholders) was pure visual noise.
  function renderLeaf(item: DashboardNavLeaf, indented = false) {
    const active = isLeafActive(item);
    const isShipped = item.shipped ?? false;
    return (
      <SidebarNavItem
        key={item.href}
        asChild
        active={active}
        className={cn(
          indented && 'py-1.5 text-[0.8125rem] font-normal',
          // An unshipped page can still be the current route (a user can
          // always type/bookmark the URL directly) — never mute the item
          // the user is actually looking at.
          !isShipped && !active && 'text-muted-foreground/50 hover:text-muted-foreground',
        )}
      >
        <Link href={item.href} onClick={onNavigate}>
          {!indented ? <item.icon /> : null}
          <span className="flex-1 truncate text-start">{messages.nav[item.labelKey]}</span>
          {!isShipped ? (
            <Badge
              variant="secondary"
              className="ms-auto shrink-0 px-1.5 py-0 text-[0.625rem] font-normal leading-4"
            >
              {messages.comingSoon.badge}
            </Badge>
          ) : null}
        </Link>
      </SidebarNavItem>
    );
  }

  function renderSection(section: DashboardNavSection) {
    const visibleItems = section.items.filter(
      (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
    );
    if (visibleItems.length === 0) return null;

    const active = isSectionActive(section);
    // Mute the trigger itself only when every visible leaf underneath is
    // still a placeholder — a section with even one real page (e.g. Sales,
    // which mixes shipped Sales/Invoices with unshipped Returns/Quotations)
    // keeps its normal weight, since the section as a whole does lead
    // somewhere real. SidebarNavSubmenu has no className prop to target the
    // trigger directly, so this styles the one actual <button> descendant
    // (the leaves render as <a> via SidebarNavItem's asChild Link, so this
    // can't accidentally catch them).
    const allUnshipped = visibleItems.every((item) => !item.shipped);

    return (
      <div
        key={section.labelKey}
        className={cn(
          allUnshipped &&
            !active &&
            '[&_button]:text-muted-foreground/50 [&_button:hover]:text-muted-foreground',
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
          {DASHBOARD_NAV_SECTIONS.map(renderSection)}
          {renderLeaf(DASHBOARD_AI_ITEM)}
          {renderSection(DASHBOARD_SETTINGS_SECTION)}
        </SidebarNav>
      </SidebarContent>
    </>
  );
}
