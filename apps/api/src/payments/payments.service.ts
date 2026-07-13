import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

type SaleAllocationStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

interface SaleAllocation {
  saleId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  createdAt: Date;
  totalAmount: Prisma.Decimal;
  allocated: Prisma.Decimal;
  remaining: Prisma.Decimal;
  status: SaleAllocationStatus;
}

// Narrow, hand-written interface (not Prisma's own generics) naming exactly
// the calls this service makes — same pattern InvoicesService already uses
// for its transaction client, since Prisma's Exact<> constraints don't play
// well with a loosely-typed args object here. Both the top-level
// tenant-guarded client and a $transaction callback's `tx` structurally
// satisfy this, so the same ledger logic works standalone or mid-transaction
// without duplicating it.
interface PaymentsDbClient {
  customer: { findFirst: (args: any) => Promise<{ id: string } | null> };
  sale: {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<unknown>;
  };
  invoice: {
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<unknown>;
  };
  payment: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<unknown>;
  };
}

@Injectable()
export class PaymentsService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db(): PaymentsDbClient {
    return this.tenantPrisma.client as unknown as PaymentsDbClient;
  }

  private async assertCustomerExists(client: PaymentsDbClient, companyId: string, customerId: string) {
    const customer = await client.customer.findFirst({ where: { id: customerId, companyId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
  }

  /**
   * The single source of truth for "how much does this customer owe" —
   * SUM(completed sale totals) minus SUM(payments), both fetched fresh and
   * walked oldest-first. Nothing here is stored; Sale.paymentStatus and
   * Invoice.status are kept as a cache of this computation (see
   * applyLedgerToSalesAndInvoices below), never the other way around.
   */
  private async computeLedger(client: PaymentsDbClient, companyId: string, customerId: string) {
    const [sales, payments] = await Promise.all([
      client.sale.findMany({
        where: { companyId, customerId, status: 'COMPLETED' },
        orderBy: { createdAt: 'asc' },
        include: { invoice: true },
      }),
      client.payment.findMany({
        where: { companyId, customerId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const totalInvoiced = sales.reduce(
      (sum, sale) => sum.plus(sale.totalAmount as Prisma.Decimal),
      new Prisma.Decimal(0),
    );
    const totalPaid = payments.reduce(
      (sum, payment) => sum.plus(payment.amount as Prisma.Decimal),
      new Prisma.Decimal(0),
    );

    let pool = totalPaid;
    const saleAllocations: SaleAllocation[] = sales.map((sale) => {
      const total = sale.totalAmount as Prisma.Decimal;
      const allocated = Prisma.Decimal.min(pool, total);
      pool = pool.minus(allocated);
      const remaining = total.minus(allocated);
      const status: SaleAllocationStatus = remaining.isZero() ? 'PAID' : allocated.isZero() ? 'UNPAID' : 'PARTIAL';
      return {
        saleId: sale.id as string,
        invoiceId: (sale.invoice?.id as string | undefined) ?? null,
        invoiceNumber: (sale.invoice?.invoiceNumber as string | undefined) ?? null,
        createdAt: sale.createdAt as Date,
        totalAmount: total,
        allocated,
        remaining,
        status,
      };
    });

    return {
      totalInvoiced,
      totalPaid,
      remaining: totalInvoiced.minus(totalPaid),
      sales: saleAllocations,
      payments,
    };
  }

  async getLedger(companyId: string, customerId: string) {
    await this.assertCustomerExists(this.db, companyId, customerId);
    const ledger = await this.computeLedger(this.db, companyId, customerId);
    return {
      totalInvoiced: ledger.totalInvoiced.toFixed(2),
      totalPaid: ledger.totalPaid.toFixed(2),
      remaining: ledger.remaining.toFixed(2),
      sales: ledger.sales.map((s) => ({
        saleId: s.saleId,
        invoiceId: s.invoiceId,
        invoiceNumber: s.invoiceNumber,
        createdAt: s.createdAt,
        totalAmount: s.totalAmount.toFixed(2),
        allocated: s.allocated.toFixed(2),
        remaining: s.remaining.toFixed(2),
        status: s.status,
      })),
      payments: ledger.payments.map((p) => ({
        id: p.id as string,
        amount: (p.amount as Prisma.Decimal).toFixed(2),
        method: p.method,
        note: p.note,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Recomputes the ledger against Sale/Invoice status fields, writing only
   * the rows that actually changed. Called after every payment-affecting
   * write (a new Payment here, or InvoicesService.markPaid()) so those two
   * status fields never drift from the ledger they're meant to reflect.
   */
  private async applyLedgerToSalesAndInvoices(
    client: PaymentsDbClient,
    companyId: string,
    customerId: string,
  ) {
    const ledger = await this.computeLedger(client, companyId, customerId);

    for (const allocation of ledger.sales) {
      const sale = await client.sale.findFirst({ where: { id: allocation.saleId, companyId } });
      if (sale && sale.paymentStatus !== allocation.status) {
        await client.sale.update({
          where: { id: allocation.saleId, companyId },
          data: { paymentStatus: allocation.status },
        });
      }
      if (allocation.invoiceId) {
        const invoiceStatus = allocation.status === 'PAID' ? 'PAID' : 'ISSUED';
        const invoice = await client.invoice.findFirst({ where: { id: allocation.invoiceId, companyId } });
        if (invoice && invoice.status !== invoiceStatus) {
          await client.invoice.update({
            where: { id: allocation.invoiceId, companyId },
            data: { status: invoiceStatus },
          });
        }
      }
    }
  }

  async recordPayment(companyId: string, customerId: string, userId: string, dto: CreatePaymentDto) {
    await this.assertCustomerExists(this.db, companyId, customerId);

    await this.tenantPrisma.client.$transaction(async (tx) => {
      const client = tx as unknown as PaymentsDbClient;
      await client.payment.create({
        data: {
          companyId,
          customerId,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method ?? 'CASH',
          note: dto.note,
          createdByUserId: userId,
        },
      });
      await this.applyLedgerToSalesAndInvoices(client, companyId, customerId);
    });

    return this.getLedger(companyId, customerId);
  }

  /**
   * Used by InvoicesService.markPaid() so the legacy "mark this one invoice
   * paid" shortcut still flows through the same ledger — it records an
   * implicit payment for exactly the sale's remaining balance and then
   * re-syncs status fields the normal way, so the two mechanisms can never
   * disagree about how much a customer has actually paid. A no-op for
   * walk-in sales (no customerId) — those never participate in the ledger.
   */
  async settleSaleInFull(tx: unknown, companyId: string, sale: { id: string; customerId: string | null }, userId: string) {
    if (!sale.customerId) return;
    const client = tx as unknown as PaymentsDbClient;

    const ledger = await this.computeLedger(client, companyId, sale.customerId);
    const allocation = ledger.sales.find((s) => s.saleId === sale.id);
    if (allocation && allocation.remaining.gt(0)) {
      await client.payment.create({
        data: {
          companyId,
          customerId: sale.customerId,
          amount: allocation.remaining,
          method: 'CASH',
          note: 'Recorded via mark-paid',
          createdByUserId: userId,
        },
      });
    }
    // Always reconcile, even when no payment was needed, so status fields
    // never stay stale relative to the ledger.
    await this.applyLedgerToSalesAndInvoices(client, companyId, sale.customerId);
  }
}
