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

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: DashboardNavGroup;
  /** Omitted for items every authenticated user may open, regardless of role. */
  requiredPermission?: PermissionKey;
}

export const NAV_GROUP_LABELS: Record<DashboardNavGroup, string> = {
  overview: 'Overview',
  operations: 'Operations',
  insights: 'Insights',
  settings: 'Settings',
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'overview' },
  { label: 'Products', href: '/dashboard/products', icon: Package, group: 'operations', requiredPermission: 'PRODUCTS:READ' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Boxes, group: 'operations', requiredPermission: 'INVENTORY:READ' },
  { label: 'Customers', href: '/dashboard/customers', icon: Users, group: 'operations', requiredPermission: 'CUSTOMERS:READ' },
  { label: 'Sales', href: '/dashboard/sales', icon: ShoppingCart, group: 'operations', requiredPermission: 'SALES:READ' },
  { label: 'Invoices', href: '/dashboard/invoices', icon: FileText, group: 'operations', requiredPermission: 'INVOICES:READ' },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3, group: 'insights', requiredPermission: 'REPORTS:READ' },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Sparkles, group: 'insights' },
  // No requiredPermission — GET /companies/me has no permission requirement,
  // so every authenticated user can at least view their company's info.
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'settings' },
];
