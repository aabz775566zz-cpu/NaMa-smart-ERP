import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { ReportDateRangeDto } from './dto/report-date-range.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly tenantPrisma: TenantGuardedPrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  async getDashboard(companyId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [salesAgg, totalCustomers, totalActiveProducts, lowStock] = await Promise.all([
      this.db.sale.aggregate({
        where: { companyId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.db.customer.count({ where: { companyId } }),
      this.db.product.count({ where: { companyId, status: 'ACTIVE' } }),
      this.inventoryService.listLowStock(companyId),
    ]);

    return {
      revenueThisMonth: (salesAgg._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
      salesCountThisMonth: salesAgg._count,
      totalCustomers,
      totalActiveProducts,
      lowStockCount: lowStock.length,
    };
  }

  async getSalesReport(companyId: string, query: ReportDateRangeDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);

    const [agg, sales] = await Promise.all([
      this.db.sale.aggregate({
        where: { companyId, status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.db.sale.findMany({
        where: { companyId, status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

    const totalRevenue = agg._sum.totalAmount ?? new Prisma.Decimal(0);
    const totalSales = agg._count;
    const averageSaleValue = totalSales > 0 ? totalRevenue.dividedBy(totalSales) : new Prisma.Decimal(0);

    // No DATE_TRUNC-equivalent in Prisma's query builder — bucketing matching
    // rows by day happens in application code. Fine at MVP row counts (one
    // company's sales over a reporting window); a raw SQL aggregate or a
    // materialized summary table would be the next step if this ever needs
    // to scale, same tradeoff already accepted for low-stock filtering.
    const dailyMap = new Map<string, Prisma.Decimal>();
    for (const sale of sales) {
      const day = sale.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? new Prisma.Decimal(0)).plus(sale.totalAmount));
    }
    const dailyBreakdown = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue: revenue.toString() }));

    return {
      totalRevenue: totalRevenue.toString(),
      totalSales,
      averageSaleValue: averageSaleValue.toString(),
      dailyBreakdown,
    };
  }

  async getProductsReport(companyId: string, query: ReportDateRangeDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);
    const limit = query.limit ?? 10;

    const grouped = await this.db.saleItem.groupBy({
      by: ['productId'],
      where: {
        companyId,
        sale: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: limit,
    });

    const productIds = grouped.map((g) => g.productId);
    const products = await this.db.product.findMany({ where: { id: { in: productIds }, companyId } });
    const productById = new Map(products.map((p) => [p.id, p]));

    // Product can never be hard-deleted once referenced by a SaleItem
    // (onDelete: Restrict), so every grouped productId is guaranteed present.
    return grouped.map((g) => {
      const product = productById.get(g.productId)!;
      const quantitySold = g._sum.quantity ?? 0;
      const revenue = g._sum.lineTotal ?? new Prisma.Decimal(0);
      // "Estimated" — uses the product's CURRENT purchasePrice, not a
      // historical cost snapshot (SaleItem never captured cost at sale time,
      // only sellingPrice). Deliberately not called "profit".
      const estimatedProfit = product.sellingPrice.minus(product.purchasePrice).times(quantitySold);

      return {
        productId: product.id,
        productName: product.name,
        quantitySold,
        revenue: revenue.toString(),
        estimatedProfit: estimatedProfit.toString(),
      };
    });
  }

  async getCustomersReport(companyId: string, query: ReportDateRangeDto) {
    const dateFilter = this.buildDateFilter(query.from, query.to);
    const limit = query.limit ?? 10;

    const grouped = await this.db.sale.groupBy({
      by: ['customerId'],
      where: {
        companyId,
        status: 'COMPLETED',
        customerId: { not: null }, // walk-in sales have no customer to attribute revenue to
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    const customerIds = grouped.map((g) => g.customerId).filter((id): id is string => id != null);
    const customers = await this.db.customer.findMany({ where: { id: { in: customerIds }, companyId } });
    const customerById = new Map(customers.map((c) => [c.id, c]));

    return grouped.map((g) => {
      const customer = customerById.get(g.customerId!)!;
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalSpent: (g._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
        purchaseCount: g._count,
      };
    });
  }

  async getInventoryReport(companyId: string) {
    const [products, lowStock] = await Promise.all([
      this.db.product.findMany({ where: { companyId } }),
      this.inventoryService.listLowStock(companyId),
    ]);

    let stockValue = new Prisma.Decimal(0);
    let totalUnitsInStock = 0;
    for (const product of products) {
      stockValue = stockValue.plus(product.purchasePrice.times(product.quantityOnHand));
      totalUnitsInStock += product.quantityOnHand;
    }

    return {
      totalProducts: products.length,
      totalUnitsInStock,
      stockValue: stockValue.toString(),
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock.map((product) => ({
        id: product.id,
        name: product.name,
        quantityOnHand: product.quantityOnHand,
        lowStockThreshold: product.lowStockThreshold,
      })),
    };
  }
}
