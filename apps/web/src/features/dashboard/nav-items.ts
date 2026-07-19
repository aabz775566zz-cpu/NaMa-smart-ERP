import type { PermissionKey } from '@erp-smart/types';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  Banknote,
  BookText,
  Boxes,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  ClipboardList,
  Coins,
  Contact,
  DatabaseBackup,
  DollarSign,
  FileBarChart,
  FileText,
  Hash,
  HandCoins,
  History,
  Hourglass,
  Landmark,
  LayoutDashboard,
  Package,
  Percent,
  PiggyBank,
  Plug,
  Receipt,
  Ruler,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tags,
  TrendingDown,
  TrendingUp,
  Truck,
  Undo2,
  Users,
  UsersRound,
} from 'lucide-react';

// Matches keys under messages.nav (see packages/i18n/messages/*.json) — every
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
  | 'settings'
  | 'comingSoon'
  | 'productsInventory'
  | 'returns'
  | 'quotations'
  | 'suppliers'
  | 'purchaseOrders'
  | 'purchaseInvoices'
  | 'supplierPayments'
  | 'categories'
  | 'inventoryMovements'
  | 'stockCount'
  | 'contacts'
  | 'customerHistory'
  | 'cash'
  | 'bankAccounts'
  | 'expenses'
  | 'revenue'
  | 'journalEntries'
  | 'employees'
  | 'payroll'
  | 'attendance'
  | 'leave'
  | 'salesReports'
  | 'inventoryReports'
  | 'profitReports'
  | 'customerReports'
  | 'financialReports'
  | 'company'
  | 'users'
  | 'rolesPermissions'
  | 'taxes'
  | 'currencies'
  | 'units'
  | 'numbering'
  | 'integrations'
  | 'backupRestore'
  | 'systemPreferences';

export interface DashboardNavLeaf {
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
  /** Omitted for items every authenticated user may open, regardless of role —
   * every not-yet-implemented placeholder route is intentionally left ungated
   * (there's no real data behind it to protect), only shipped features keep
   * their permission requirement. */
  requiredPermission?: PermissionKey;
  /** True only for leaves backed by a real, shipped page. Unshipped leaves
   * live exclusively inside DASHBOARD_COMING_SOON_SECTION. */
  shipped?: boolean;
  /** Iris-accented icon — reserved for AI surfaces (Constitution ch.7/15). */
  accent?: boolean;
}

export interface DashboardNavSection {
  labelKey: NavLabelKey;
  icon: LucideIcon;
  items: DashboardNavLeaf[];
}

/* ==========================================================================
 * The sidebar shows ONLY what actually works, at full weight. Everything
 * not yet built lives in a single collapsed, de-emphasized "Coming soon"
 * section at the bottom — the menu is a short list of truths, not a wall
 * of promises (Constitution ch.3: "a menu of promises is worse than a
 * short list of truths").
 * ========================================================================== */

export const DASHBOARD_HOME_ITEM: DashboardNavLeaf = {
  labelKey: 'dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
  shipped: true,
};

// Directly under Home — the AI assistant is the centre of the experience,
// not a footnote below seven collapsed sections.
export const DASHBOARD_AI_ITEM: DashboardNavLeaf = {
  labelKey: 'aiAssistant',
  href: '/dashboard/ai',
  icon: Sparkles,
  shipped: true,
  accent: true,
};

export const CUSTOMERS_NAV_ITEM: DashboardNavLeaf = {
  labelKey: 'customers',
  href: '/dashboard/customers',
  icon: Users,
  requiredPermission: 'CUSTOMERS:READ',
  shipped: true,
};

export const SUPPLIERS_NAV_ITEM: DashboardNavLeaf = {
  labelKey: 'suppliers',
  href: '/dashboard/purchasing/suppliers',
  icon: Truck,
  requiredPermission: 'SUPPLIERS:READ',
  shipped: true,
};

export const DASHBOARD_NAV_SECTIONS: DashboardNavSection[] = [
  {
    labelKey: 'sales',
    icon: ShoppingCart,
    items: [
      { labelKey: 'sales', href: '/dashboard/sales', icon: ShoppingCart, requiredPermission: 'SALES:READ', shipped: true },
      { labelKey: 'invoices', href: '/dashboard/invoices', icon: FileText, requiredPermission: 'INVOICES:READ', shipped: true },
    ],
  },
  {
    labelKey: 'productsInventory',
    icon: Package,
    items: [
      { labelKey: 'products', href: '/dashboard/products', icon: Package, requiredPermission: 'PRODUCTS:READ', shipped: true },
      { labelKey: 'categories', href: '/dashboard/products/categories', icon: Tags, requiredPermission: 'PRODUCTS:READ', shipped: true },
      { labelKey: 'inventory', href: '/dashboard/inventory', icon: Boxes, requiredPermission: 'INVENTORY:READ', shipped: true },
    ],
  },
  {
    labelKey: 'reports',
    icon: BarChart3,
    items: [
      { labelKey: 'salesReports', href: '/dashboard/reports/sales', icon: TrendingUp, shipped: true },
      { labelKey: 'inventoryReports', href: '/dashboard/reports/inventory', icon: Boxes, shipped: true },
      { labelKey: 'profitReports', href: '/dashboard/reports/profit', icon: PiggyBank, shipped: true },
      { labelKey: 'customerReports', href: '/dashboard/reports/customers', icon: UsersRound, shipped: true },
      { labelKey: 'financialReports', href: '/dashboard/reports/financial', icon: FileBarChart, shipped: true },
    ],
  },
];

export const DASHBOARD_SETTINGS_SECTION: DashboardNavSection = {
  labelKey: 'settings',
  icon: Settings,
  items: [
    { labelKey: 'company', href: '/dashboard/settings/company', icon: Building2, shipped: true },
    { labelKey: 'users', href: '/dashboard/settings/users', icon: Users, requiredPermission: 'USERS:READ', shipped: true },
    { labelKey: 'rolesPermissions', href: '/dashboard/settings/roles-permissions', icon: ShieldCheck, requiredPermission: 'USERS:READ', shipped: true },
  ],
};

// Every planned-but-unbuilt route, in one place. The routes stay reachable
// (each renders <UnderDevelopmentPage/>) but no longer masquerade as product.
export const DASHBOARD_COMING_SOON_SECTION: DashboardNavSection = {
  labelKey: 'comingSoon',
  icon: Hourglass,
  items: [
    { labelKey: 'returns', href: '/dashboard/sales/returns', icon: Undo2 },
    { labelKey: 'quotations', href: '/dashboard/sales/quotations', icon: ClipboardList },
    { labelKey: 'purchaseOrders', href: '/dashboard/purchasing/purchase-orders', icon: ClipboardList },
    { labelKey: 'purchaseInvoices', href: '/dashboard/purchasing/purchase-invoices', icon: Receipt },
    { labelKey: 'supplierPayments', href: '/dashboard/purchasing/supplier-payments', icon: HandCoins },
    { labelKey: 'inventoryMovements', href: '/dashboard/inventory/movements', icon: ArrowLeftRight },
    { labelKey: 'stockCount', href: '/dashboard/inventory/stock-count', icon: ClipboardCheck },
    { labelKey: 'contacts', href: '/dashboard/customers/contacts', icon: Contact },
    { labelKey: 'customerHistory', href: '/dashboard/customers/history', icon: History },
    { labelKey: 'cash', href: '/dashboard/finance/cash', icon: Banknote },
    { labelKey: 'bankAccounts', href: '/dashboard/finance/bank-accounts', icon: Landmark },
    { labelKey: 'expenses', href: '/dashboard/finance/expenses', icon: TrendingDown },
    { labelKey: 'revenue', href: '/dashboard/finance/revenue', icon: TrendingUp },
    { labelKey: 'journalEntries', href: '/dashboard/finance/journal-entries', icon: BookText },
    { labelKey: 'employees', href: '/dashboard/employees', icon: Briefcase },
    { labelKey: 'payroll', href: '/dashboard/employees/payroll', icon: Coins },
    { labelKey: 'attendance', href: '/dashboard/employees/attendance', icon: CalendarCheck },
    { labelKey: 'leave', href: '/dashboard/employees/leave', icon: CalendarX },
    { labelKey: 'taxes', href: '/dashboard/settings/taxes', icon: Percent },
    { labelKey: 'currencies', href: '/dashboard/settings/currencies', icon: DollarSign },
    { labelKey: 'units', href: '/dashboard/settings/units', icon: Ruler },
    { labelKey: 'numbering', href: '/dashboard/settings/numbering', icon: Hash },
    { labelKey: 'integrations', href: '/dashboard/settings/integrations', icon: Plug },
    { labelKey: 'backupRestore', href: '/dashboard/settings/backup-restore', icon: DatabaseBackup },
    { labelKey: 'systemPreferences', href: '/dashboard/settings/system-preferences', icon: SlidersHorizontal },
  ],
};

const ALL_NAV_LEAVES: DashboardNavLeaf[] = [
  DASHBOARD_HOME_ITEM,
  DASHBOARD_AI_ITEM,
  CUSTOMERS_NAV_ITEM,
  SUPPLIERS_NAV_ITEM,
  ...DASHBOARD_NAV_SECTIONS.flatMap((section) => section.items),
  ...DASHBOARD_SETTINGS_SECTION.items,
  ...DASHBOARD_COMING_SOON_SECTION.items,
];

/** Longest-prefix match of the current pathname against every nav leaf —
 * used by the header to show where the user is. '/dashboard' only matches
 * exactly (it prefixes everything). Returns null for routes that aren't in
 * the nav (e.g. /dashboard/profile), where the header simply shows nothing. */
export function findActiveNavLabelKey(pathname: string | null): NavLabelKey | null {
  if (!pathname) return null;
  let best: DashboardNavLeaf | null = null;
  for (const leaf of ALL_NAV_LEAVES) {
    const matches =
      leaf.href === '/dashboard'
        ? pathname === leaf.href
        : pathname === leaf.href || pathname.startsWith(`${leaf.href}/`);
    if (matches && (!best || leaf.href.length > best.href.length)) {
      best = leaf;
    }
  }
  return best?.labelKey ?? null;
}
