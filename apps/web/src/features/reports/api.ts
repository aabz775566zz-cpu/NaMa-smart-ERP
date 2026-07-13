import type {
  CustomersReport,
  DailyCloseReport,
  DailyCloseReportParams,
  DashboardReport,
  InventoryReport,
  ProductsReport,
  ReportDateRangeParams,
  SalesReport,
} from '@erp-smart/types';

import { apiClient } from '@/lib/api';

function buildQuery(params?: ReportDateRangeParams) {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// Read-only module — REPORTS:READ gates the whole controller, no mutations
// exist anywhere. /reports/dashboard and /reports/inventory take no params;
// /reports/sales, /products, /customers accept from/to/limit (ReportDateRangeDto).
export function getDashboardReport() {
  return apiClient.get<DashboardReport>('/reports/dashboard');
}

export function getSalesReport(params?: ReportDateRangeParams) {
  return apiClient.get<SalesReport>(`/reports/sales${buildQuery(params)}`);
}

export function getProductsReport(params?: ReportDateRangeParams) {
  return apiClient.get<ProductsReport>(`/reports/products${buildQuery(params)}`);
}

export function getCustomersReport(params?: ReportDateRangeParams) {
  return apiClient.get<CustomersReport>(`/reports/customers${buildQuery(params)}`);
}

export function getInventoryReport() {
  return apiClient.get<InventoryReport>('/reports/inventory');
}

export function getDailyCloseReport(params?: DailyCloseReportParams) {
  const query = params?.date ? `?date=${encodeURIComponent(params.date)}` : '';
  return apiClient.get<DailyCloseReport>(`/reports/daily-close${query}`);
}
