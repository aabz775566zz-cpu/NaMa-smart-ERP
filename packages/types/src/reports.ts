/** Backend has five report endpoints, not "Revenue"/"Profit" as separate
 * ones — revenue appears inside Dashboard/Sales reports, and estimatedProfit
 * is a per-product field inside the Products report. Named to match what
 * ReportsService actually exposes, not invented endpoint names. */

/** GET /reports/dashboard */
export interface DashboardReport {
  revenueThisMonth: string;
  salesCountThisMonth: number;
  totalCustomers: number;
  totalActiveProducts: number;
  lowStockCount: number;
}

export interface SalesReportDailyEntry {
  date: string;
  revenue: string;
}

/** GET /reports/sales */
export interface SalesReport {
  totalRevenue: string;
  totalSales: number;
  averageSaleValue: string;
  dailyBreakdown: SalesReportDailyEntry[];
}

/** One entry of GET /reports/products (the endpoint returns an array
 * directly, not wrapped in an envelope). estimatedProfit is deliberately
 * named — not "profit" — because it's computed from the product's CURRENT
 * purchasePrice, not a historical cost snapshot. See ReportsService. */
export interface ProductsReportEntry {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: string;
  estimatedProfit: string;
}

/** GET /reports/products */
export type ProductsReport = ProductsReportEntry[];

/** One entry of GET /reports/customers (also a direct array response). */
export interface CustomersReportEntry {
  customerId: string;
  customerName: string;
  totalSpent: string;
  purchaseCount: number;
}

/** GET /reports/customers */
export type CustomersReport = CustomersReportEntry[];

export interface InventoryReportLowStockProduct {
  id: string;
  name: string;
  quantityOnHand: number;
  lowStockThreshold: number | null;
}

/** GET /reports/inventory */
export interface InventoryReport {
  totalProducts: number;
  totalUnitsInStock: number;
  stockValue: string;
  lowStockCount: number;
  lowStockProducts: InventoryReportLowStockProduct[];
}

/** Query params accepted by /reports/sales, /reports/products,
 * /reports/customers (ReportDateRangeDto). /reports/dashboard and
 * /reports/inventory take no params. */
export interface ReportDateRangeParams {
  from?: string;
  to?: string;
  limit?: number;
}
