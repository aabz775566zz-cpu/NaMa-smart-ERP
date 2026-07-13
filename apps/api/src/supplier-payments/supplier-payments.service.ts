import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';

type PurchaseInvoiceAllocationStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

interface PurchaseInvoiceAllocation {
  purchaseInvoiceId: string;
  invoiceNumber: string | null;
  createdAt: Date;
  totalAmount: Prisma.Decimal;
  allocated: Prisma.Decimal;
  remaining: Prisma.Decimal;
  status: PurchaseInvoiceAllocationStatus;
}

// Narrow, hand-written interface (not Prisma's own generics) naming exactly
// the calls this service makes — same pattern PaymentsService already uses
// for its transaction client. Both the top-level tenant-guarded client and a
// $transaction callback's `tx` structurally satisfy this, so the same
// ledger logic works standalone or mid-transaction without duplicating it.
interface SupplierPaymentsDbClient {
  supplier: { findFirst: (args: any) => Promise<{ id: string } | null> };
  purchaseInvoice: {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<unknown>;
  };
  supplierPayment: {
    findMany: (args: any) => Promise<any[]>;
    create: (args: any) => Promise<unknown>;
  };
}

@Injectable()
export class SupplierPaymentsService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db(): SupplierPaymentsDbClient {
    return this.tenantPrisma.client as unknown as SupplierPaymentsDbClient;
  }

  private async assertSupplierExists(client: SupplierPaymentsDbClient, companyId: string, supplierId: string) {
    const supplier = await client.supplier.findFirst({ where: { id: supplierId, companyId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found.');
    }
  }

  /**
   * The single source of truth for "how much do we owe this supplier" —
   * SUM(received purchase invoice totals) minus SUM(supplier payments),
   * both fetched fresh and walked oldest-first. Nothing here is stored;
   * PurchaseInvoice.paymentStatus is kept as a cache of this computation
   * (see applyLedgerToPurchaseInvoices below), never the other way around.
   * Mirrors PaymentsService.computeLedger() — the one structural
   * simplification is that a PurchaseInvoice already carries its own
   * invoiceNumber directly (unlike Sale, which needs a join to a separate
   * Invoice row), so there's no equivalent second table to reconcile.
   */
  private async computeLedger(client: SupplierPaymentsDbClient, companyId: string, supplierId: string) {
    const [purchaseInvoices, payments] = await Promise.all([
      client.purchaseInvoice.findMany({
        where: { companyId, supplierId, status: 'RECEIVED' },
        orderBy: { createdAt: 'asc' },
      }),
      client.supplierPayment.findMany({
        where: { companyId, supplierId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const totalBilled = purchaseInvoices.reduce(
      (sum, invoice) => sum.plus(invoice.totalAmount as Prisma.Decimal),
      new Prisma.Decimal(0),
    );
    const totalPaid = payments.reduce(
      (sum, payment) => sum.plus(payment.amount as Prisma.Decimal),
      new Prisma.Decimal(0),
    );

    let pool = totalPaid;
    const purchaseInvoiceAllocations: PurchaseInvoiceAllocation[] = purchaseInvoices.map((invoice) => {
      const total = invoice.totalAmount as Prisma.Decimal;
      const allocated = Prisma.Decimal.min(pool, total);
      pool = pool.minus(allocated);
      const remaining = total.minus(allocated);
      const status: PurchaseInvoiceAllocationStatus = remaining.isZero()
        ? 'PAID'
        : allocated.isZero()
          ? 'UNPAID'
          : 'PARTIAL';
      return {
        purchaseInvoiceId: invoice.id as string,
        invoiceNumber: (invoice.invoiceNumber as string | null) ?? null,
        createdAt: invoice.createdAt as Date,
        totalAmount: total,
        allocated,
        remaining,
        status,
      };
    });

    return {
      totalBilled,
      totalPaid,
      remaining: totalBilled.minus(totalPaid),
      purchaseInvoices: purchaseInvoiceAllocations,
      payments,
    };
  }

  async getLedger(companyId: string, supplierId: string) {
    await this.assertSupplierExists(this.db, companyId, supplierId);
    const ledger = await this.computeLedger(this.db, companyId, supplierId);
    return {
      totalBilled: ledger.totalBilled.toFixed(2),
      totalPaid: ledger.totalPaid.toFixed(2),
      remaining: ledger.remaining.toFixed(2),
      purchaseInvoices: ledger.purchaseInvoices.map((p) => ({
        purchaseInvoiceId: p.purchaseInvoiceId,
        invoiceNumber: p.invoiceNumber,
        createdAt: p.createdAt,
        totalAmount: p.totalAmount.toFixed(2),
        allocated: p.allocated.toFixed(2),
        remaining: p.remaining.toFixed(2),
        status: p.status,
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
   * Recomputes the ledger against PurchaseInvoice.paymentStatus, writing
   * only the rows that actually changed. Called after every
   * payment-affecting write (a new SupplierPayment here, or
   * PurchaseInvoicesService.markPaid()) so that field never drifts from the
   * ledger it's meant to reflect. Mirrors
   * PaymentsService.applyLedgerToSalesAndInvoices() minus the second-table
   * step (see computeLedger's comment).
   */
  private async applyLedgerToPurchaseInvoices(
    client: SupplierPaymentsDbClient,
    companyId: string,
    supplierId: string,
  ) {
    const ledger = await this.computeLedger(client, companyId, supplierId);

    for (const allocation of ledger.purchaseInvoices) {
      const purchaseInvoice = await client.purchaseInvoice.findFirst({
        where: { id: allocation.purchaseInvoiceId, companyId },
      });
      if (purchaseInvoice && purchaseInvoice.paymentStatus !== allocation.status) {
        await client.purchaseInvoice.update({
          where: { id: allocation.purchaseInvoiceId, companyId },
          data: { paymentStatus: allocation.status },
        });
      }
    }
  }

  async recordPayment(companyId: string, supplierId: string, userId: string, dto: CreateSupplierPaymentDto) {
    await this.assertSupplierExists(this.db, companyId, supplierId);

    await this.tenantPrisma.client.$transaction(async (tx) => {
      const client = tx as unknown as SupplierPaymentsDbClient;
      await client.supplierPayment.create({
        data: {
          companyId,
          supplierId,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method ?? 'CASH',
          note: dto.note,
          createdByUserId: userId,
        },
      });
      await this.applyLedgerToPurchaseInvoices(client, companyId, supplierId);
    });

    return this.getLedger(companyId, supplierId);
  }

  /**
   * Used by PurchaseInvoicesService.markPaid() so the legacy "mark this one
   * purchase invoice paid" shortcut still flows through the same ledger —
   * it records an implicit payment for exactly the invoice's remaining
   * balance and then re-syncs paymentStatus the normal way, so the two
   * mechanisms can never disagree about how much we've actually paid this
   * supplier. Mirrors PaymentsService.settleSaleInFull() — no walk-in-style
   * no-op branch needed here, since every PurchaseInvoice always has a
   * required supplierId (unlike Sale.customerId, which can be null).
   */
  async settlePurchaseInvoiceInFull(
    tx: unknown,
    companyId: string,
    purchaseInvoice: { id: string; supplierId: string },
    userId: string,
  ) {
    const client = tx as unknown as SupplierPaymentsDbClient;

    const ledger = await this.computeLedger(client, companyId, purchaseInvoice.supplierId);
    const allocation = ledger.purchaseInvoices.find((p) => p.purchaseInvoiceId === purchaseInvoice.id);
    if (allocation && allocation.remaining.gt(0)) {
      await client.supplierPayment.create({
        data: {
          companyId,
          supplierId: purchaseInvoice.supplierId,
          amount: allocation.remaining,
          method: 'CASH',
          note: 'Recorded via mark-paid',
          createdByUserId: userId,
        },
      });
    }
    // Always reconcile, even when no payment was needed, so paymentStatus
    // never stays stale relative to the ledger.
    await this.applyLedgerToPurchaseInvoices(client, companyId, purchaseInvoice.supplierId);
  }
}
