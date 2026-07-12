'use client';

import type { ReportDateRangeParams } from '@erp-smart/types';
import { useQuery } from '@tanstack/react-query';

import * as reportsApi from './api';

export const reportsKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportsKeys.all, 'dashboard'] as const,
  sales: (params?: ReportDateRangeParams) => [...reportsKeys.all, 'sales', params ?? {}] as const,
  products: (params?: ReportDateRangeParams) => [...reportsKeys.all, 'products', params ?? {}] as const,
  customers: (params?: ReportDateRangeParams) => [...reportsKeys.all, 'customers', params ?? {}] as const,
  inventory: () => [...reportsKeys.all, 'inventory'] as const,
};

export function useDashboardReport() {
  return useQuery({ queryKey: reportsKeys.dashboard(), queryFn: reportsApi.getDashboardReport });
}

export function useSalesReport(params?: ReportDateRangeParams) {
  return useQuery({ queryKey: reportsKeys.sales(params), queryFn: () => reportsApi.getSalesReport(params) });
}

export function useProductsReport(params?: ReportDateRangeParams) {
  return useQuery({ queryKey: reportsKeys.products(params), queryFn: () => reportsApi.getProductsReport(params) });
}

export function useCustomersReport(params?: ReportDateRangeParams) {
  return useQuery({ queryKey: reportsKeys.customers(params), queryFn: () => reportsApi.getCustomersReport(params) });
}

export function useInventoryReport() {
  return useQuery({ queryKey: reportsKeys.inventory(), queryFn: reportsApi.getInventoryReport });
}
