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

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omitted for items every authenticated user may open, regardless of role. */
  requiredPermission?: PermissionKey;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package, requiredPermission: 'PRODUCTS:READ' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Boxes, requiredPermission: 'INVENTORY:READ' },
  { label: 'Customers', href: '/dashboard/customers', icon: Users, requiredPermission: 'CUSTOMERS:READ' },
  { label: 'Sales', href: '/dashboard/sales', icon: ShoppingCart, requiredPermission: 'SALES:READ' },
  { label: 'Invoices', href: '/dashboard/invoices', icon: FileText, requiredPermission: 'INVOICES:READ' },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3, requiredPermission: 'REPORTS:READ' },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Sparkles },
  // No requiredPermission — GET /companies/me has no permission requirement,
  // so every authenticated user can at least view their company's info.
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];
