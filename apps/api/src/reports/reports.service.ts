import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { DailyCloseReportDto } from './dto/daily-close-report.dto';
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
    const now = new Date();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Pacing comparison: month-to-date vs the SAME elapsed window of the
    // previous month (1st → same point in time), never the full previous
    // month — comparing 12 days of June against all of May would read as a
    // false collapse every month until the final day. Clamped to the start
    // of the current month so a long month never bleeds into a short one.
    const startOfPrevMonth = new Date(startOfMonth);
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    const elapsedThisMonth = now.getTime() - startOfMonth.getTime();
    const prevWindowEnd = new Date(
      Math.min(startOfPrevMonth.getTime() + elapsedThisMonth, startOfMonth.getTime()),
    );

    // 14-day revenue series for the briefing sparkline, bucketed by UTC day
    // (same convention getSalesReport already uses for dailyBreakdown).
    const SPARKLINE_DAYS = 14;
    const sparklineStart = new Date(now);
    sparklineStart.setUTCHours(0, 0, 0, 0);
    sparklineStart.setUTCDate(sparklineStart.getUTCDate() - (SPARKLINE_DAYS - 1));

    const [salesAgg, prevSalesAgg, totalCustomers, totalActiveProducts, lowStock, recentSales, invoicedAgg, paidAgg] =
      await Promise.all([
        this.db.sale.aggregate({
          where: { companyId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        this.db.sale.aggregate({
          where: { companyId, status: 'COMPLETED', createdAt: { gte: startOfPrevMonth, lt: prevWindowEnd } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        this.db.customer.count({ where: { companyId } }),
        this.db.product.count({ where: { companyId, status: 'ACTIVE' } }),
        this.inventoryService.listLowStock(companyId),
        this.db.sale.findMany({
          where: { companyId, status: 'COMPLETED', createdAt: { gte: sparklineStart } },
          select: { totalAmount: true, createdAt: true },
        }),
        // Receivables: only customer-linked sales can be owed (walk-in sales
        // have no debtor); payments are always customer-linked. Same "single
        // source of truth" arithmetic as PaymentsService.computeLedger,
        // aggregated company-wide.
        this.db.sale.aggregate({
          where: { companyId, status: 'COMPLETED', customerId: { not: null } },
          _sum: { totalAmount: true },
        }),
        this.db.payment.aggregate({ where: { companyId }, _sum: { amount: true } }),
      ]);

    const dailyMap = new Map<string, Prisma.Decimal>();
    for (const sale of recentSales) {
      const day = sale.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? new Prisma.Decimal(0)).plus(sale.totalAmount));
    }
    const dailyRevenue: { date: string; revenue: string }[] = [];
    for (let i = 0; i < SPARKLINE_DAYS; i += 1) {
      const day = new Date(sparklineStart);
      day.setUTCDate(day.getUTCDate() + i);
      const key = day.toISOString().slice(0, 10);
      dailyRevenue.push({ date: key, revenue: (dailyMap.get(key) ?? new Prisma.Decimal(0)).toString() });
    }

    const totalInvoiced = invoicedAgg._sum.totalAmount ?? new Prisma.Decimal(0);
    const totalPaid = paidAgg._sum.amount ?? new Prisma.Decimal(0);
    const receivables = totalInvoiced.minus(totalPaid);

    return {
      revenueThisMonth: (salesAgg._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
      revenuePreviousMonth: (prevSalesAgg._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
      salesCountThisMonth: salesAgg._count,
      salesCountPreviousMonth: prevSalesAgg._count,
      totalCustomers,
      totalActiveProducts,
      lowStockCount: lowStock.length,
      receivablesOutstanding: (receivables.isNegative() ? new Prisma.Decimal(0) : receivables).toString(),
      dailyRevenue,
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

  // End-of-day till reconciliation for a shop owner: how much was booked
  // today, how much of that was actually collected today vs. left on
  // credit, and how much old debt was paid down today.
  //
  // "Cash sales" here means paid-in-full-at-sale (Sale.paymentStatus ===
  // 'PAID'), not literally Sale.paymentMethod === 'CASH' — a card or
  // transfer sale paid in full at the counter is still money in hand today,
  // while a CASH-method sale explicitly created as PARTIAL/UNPAID is money
  // still owed. paymentStatus is the "did I actually get paid" signal;
  // paymentMethod is only "how", which isn't what a close-of-day
  // reconciliation needs.
  //
  // "Payments collected" sums the Payment ledger (Phase 4) for the day —
  // debt collected against ANY sale, including ones from previous days.
  // This is a different, non-overlapping population from "cash sales" in
  // the common case: PaymentsService only ever writes a Payment row for a
  // customer-linked sale that was originally left partial/unpaid (see
  // PaymentsService.recordPayment/settleSaleInFull) — a same-day
  // paid-in-full walk-in sale never creates one. The one case where the
  // same transaction can appear in both figures is a customer-linked sale
  // created AND fully settled on the same day; that's not double-counting,
  // it's two different questions ("revenue booked" vs. "cash received")
  // about the same event, so the two figures are deliberately shown
  // separately rather than summed into one number.
  async getDailyCloseReport(companyId: string, query: DailyCloseReportDto) {
    const target = query.date ? new Date(query.date) : new Date();
    const startOfDay = new Date(target);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);
    const dayRange = { gte: startOfDay, lte: endOfDay };

    const [sales, paymentsAgg] = await Promise.all([
      this.db.sale.findMany({
        where: { companyId, status: 'COMPLETED', createdAt: dayRange },
        select: { totalAmount: true, paymentStatus: true },
      }),
      this.db.payment.aggregate({
        where: { companyId, createdAt: dayRange },
        _sum: { amount: true },
      }),
    ]);

    let totalSales = new Prisma.Decimal(0);
    let cashSales = new Prisma.Decimal(0);
    let creditSales = new Prisma.Decimal(0);
    for (const sale of sales) {
      totalSales = totalSales.plus(sale.totalAmount);
      if (sale.paymentStatus === 'PAID') {
        cashSales = cashSales.plus(sale.totalAmount);
      } else {
        creditSales = creditSales.plus(sale.totalAmount);
      }
    }

    return {
      date: startOfDay.toISOString().slice(0, 10),
      salesCount: sales.length,
      totalSales: totalSales.toString(),
      cashSales: cashSales.toString(),
      creditSales: creditSales.toString(),
      paymentsCollected: (paymentsAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
    };
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
