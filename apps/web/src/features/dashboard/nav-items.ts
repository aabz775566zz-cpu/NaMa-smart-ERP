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
  ShoppingBag,
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
  | 'purchasing'
  | 'productsInventory'
  | 'finance'
  | 'employees'
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
   * (there's no real data behind it to protect), only the handful of already
   * shipped features keep their existing permission requirement. */
  requiredPermission?: PermissionKey;
  /** True only for leaves backed by a real, shipped page — everything else
   * renders <UnderDevelopmentPage/> and is visually de-emphasized in the
   * sidebar so real modules aren't lost among ~40 placeholder routes. */
  shipped?: boolean;
}

export interface DashboardNavSection {
  labelKey: NavLabelKey;
  icon: LucideIcon;
  items: DashboardNavLeaf[];
}

// Rendered directly, with no collapsible section wrapper — matches the
// existing top/bottom placement of Dashboard and AI Assistant in the
// approved navigation structure.
export const DASHBOARD_HOME_ITEM: DashboardNavLeaf = {
  labelKey: 'dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
  shipped: true,
};

export const DASHBOARD_AI_ITEM: DashboardNavLeaf = {
  labelKey: 'aiAssistant',
  href: '/dashboard/ai',
  icon: Sparkles,
  shipped: true,
};

// The full future structure of the ERP. Only Sales, Invoices, Products,
// Inventory, and Customers point at already-implemented pages (unchanged
// hrefs/permissions from before this pass) — every other leaf is a new
// placeholder route rendering <UnderDevelopmentPage/>.
export const DASHBOARD_NAV_SECTIONS: DashboardNavSection[] = [
  {
    labelKey: 'sales',
    icon: ShoppingCart,
    items: [
      { labelKey: 'sales', href: '/dashboard/sales', icon: ShoppingCart, requiredPermission: 'SALES:READ', shipped: true },
      { labelKey: 'invoices', href: '/dashboard/invoices', icon: FileText, requiredPermission: 'INVOICES:READ', shipped: true },
      { labelKey: 'returns', href: '/dashboard/sales/returns', icon: Undo2 },
      { labelKey: 'quotations', href: '/dashboard/sales/quotations', icon: ClipboardList },
    ],
  },
  {
    labelKey: 'purchasing',
    icon: ShoppingBag,
    items: [
      { labelKey: 'suppliers', href: '/dashboard/purchasing/suppliers', icon: Truck },
      { labelKey: 'purchaseOrders', href: '/dashboard/purchasing/purchase-orders', icon: ClipboardList },
      { labelKey: 'purchaseInvoices', href: '/dashboard/purchasing/purchase-invoices', icon: Receipt },
      { labelKey: 'supplierPayments', href: '/dashboard/purchasing/supplier-payments', icon: HandCoins },
    ],
  },
  {
    labelKey: 'productsInventory',
    icon: Package,
    items: [
      { labelKey: 'products', href: '/dashboard/products', icon: Package, requiredPermission: 'PRODUCTS:READ', shipped: true },
      { labelKey: 'categories', href: '/dashboard/products/categories', icon: Tags, requiredPermission: 'PRODUCTS:READ', shipped: true },
      { labelKey: 'inventory', href: '/dashboard/inventory', icon: Boxes, requiredPermission: 'INVENTORY:READ', shipped: true },
      { labelKey: 'inventoryMovements', href: '/dashboard/inventory/movements', icon: ArrowLeftRight },
      { labelKey: 'stockCount', href: '/dashboard/inventory/stock-count', icon: ClipboardCheck },
    ],
  },
  {
    labelKey: 'customers',
    icon: Users,
    items: [
      { labelKey: 'customers', href: '/dashboard/customers', icon: Users, requiredPermission: 'CUSTOMERS:READ', shipped: true },
      { labelKey: 'contacts', href: '/dashboard/customers/contacts', icon: Contact },
      { labelKey: 'customerHistory', href: '/dashboard/customers/history', icon: History },
    ],
  },
  {
    labelKey: 'finance',
    icon: Landmark,
    items: [
      { labelKey: 'cash', href: '/dashboard/finance/cash', icon: Banknote },
      { labelKey: 'bankAccounts', href: '/dashboard/finance/bank-accounts', icon: Landmark },
      { labelKey: 'expenses', href: '/dashboard/finance/expenses', icon: TrendingDown },
      { labelKey: 'revenue', href: '/dashboard/finance/revenue', icon: TrendingUp },
      { labelKey: 'journalEntries', href: '/dashboard/finance/journal-entries', icon: BookText },
    ],
  },
  {
    labelKey: 'employees',
    icon: Briefcase,
    items: [
      { labelKey: 'employees', href: '/dashboard/employees', icon: Briefcase },
      { labelKey: 'payroll', href: '/dashboard/employees/payroll', icon: Coins },
      { labelKey: 'attendance', href: '/dashboard/employees/attendance', icon: CalendarCheck },
      { labelKey: 'leave', href: '/dashboard/employees/leave', icon: CalendarX },
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
    { labelKey: 'rolesPermissions', href: '/dashboard/settings/roles-permissions', icon: ShieldCheck },
    { labelKey: 'taxes', href: '/dashboard/settings/taxes', icon: Percent },
    { labelKey: 'currencies', href: '/dashboard/settings/currencies', icon: DollarSign },
    { labelKey: 'units', href: '/dashboard/settings/units', icon: Ruler },
    { labelKey: 'numbering', href: '/dashboard/settings/numbering', icon: Hash },
    { labelKey: 'integrations', href: '/dashboard/settings/integrations', icon: Plug },
    { labelKey: 'backupRestore', href: '/dashboard/settings/backup-restore', icon: DatabaseBackup },
    { labelKey: 'systemPreferences', href: '/dashboard/settings/system-preferences', icon: SlidersHorizontal },
  ],
};
