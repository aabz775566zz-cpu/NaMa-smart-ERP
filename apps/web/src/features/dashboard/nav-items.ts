import type { PermissionKey } from '@erp-smart/types';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';

export type DashboardNavGroup = 'overview' | 'operations' | 'insights' | 'settings';

// Matches keys under messages.nav (see packages/i18n/messages/*.json) — the
// item stores the translation key, not the label text, so the sidebar can
// resolve it against whichever locale is active.
export type NavLabelKey =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'sales'
  | 'invoices'
  | 'reports'
  | 'aiAssistant'
  | 'settings';

export interface DashboardNavItem {
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
  group: DashboardNavGroup;
  /** Omitted for items every authenticated user may open, regardless of role. */
  requiredPermission?: PermissionKey;
}

export const NAV_GROUP_LABEL_KEYS: Record<DashboardNavGroup, 'groupOverview' | 'groupOperations' | 'groupInsights' | 'settings'> = {
  overview: 'groupOverview',
  operations: 'groupOperations',
  insights: 'groupInsights',
  settings: 'settings',
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'overview' },
  { labelKey: 'products', href: '/dashboard/products', icon: Package, group: 'operations', requiredPermission: 'PRODUCTS:READ' },
  { labelKey: 'inventory', href: '/dashboard/inventory', icon: Boxes, group: 'operations', requiredPermission: 'INVENTORY:READ' },
  { labelKey: 'customers', href: '/dashboard/customers', icon: Users, group: 'operations', requiredPermission: 'CUSTOMERS:READ' },
  { labelKey: 'sales', href: '/dashboard/sales', icon: ShoppingCart, group: 'operations', requiredPermission: 'SALES:READ' },
  { labelKey: 'invoices', href: '/dashboard/invoices', icon: FileText, group: 'operations', requiredPermission: 'INVOICES:READ' },
  { labelKey: 'reports', href: '/dashboard/reports', icon: BarChart3, group: 'insights', requiredPermission: 'REPORTS:READ' },
  { labelKey: 'aiAssistant', href: '/dashboard/ai', icon: Sparkles, group: 'insights' },
  // No requiredPermission — GET /companies/me has no permission requirement,
  // so every authenticated user can at least view their company's info.
  { labelKey: 'settings', href: '/dashboard/settings', icon: Settings, group: 'settings' },
];
