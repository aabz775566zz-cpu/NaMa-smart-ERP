import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InvoiceStatus, Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';

const INVOICE_STATUSES = ['ISSUED', 'PAID'] as const;

interface SaleForInvoice {
  id: string;
  totalAmount: Prisma.Decimal;
}

// Same narrow-interface pattern as InventoryService's MovementTxClient —
// Prisma's Exact<> generic constraint on `create`/`upsert` rejects a loose
// object-bag type, so args stay `any` here; this interface exists to name
// the calls used, not fully type them.
interface InvoiceTxClient {
  companyCounter: {
    upsert: (args: any) => Promise<{ value: number }>;
  };
  invoice: {
    create: (args: any) => Promise<unknown>;
  };
}

@Injectable()
export class InvoicesService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  // Called by SalesService.complete() inside the transaction it already
  // owns — invoice numbering must be atomic with sale completion and the
  // stock decrements, not a separate step that could fail independently.
  async createForSaleWithTx(tx: InvoiceTxClient, companyId: string, sale: SaleForInvoice) {
    const counter = await tx.companyCounter.upsert({
      where: { companyId_counterKey: { companyId, counterKey: 'INVOICE' } },
      create: { companyId, counterKey: 'INVOICE', value: 1 },
      update: { value: { increment: 1 } },
    });

    const invoiceNumber = `INV-${String(counter.value).padStart(4, '0')}`;

    return tx.invoice.create({
      data: {
        companyId,
        saleId: sale.id,
        invoiceNumber,
        totalAmount: sale.totalAmount,
      },
    });
  }

  async list(companyId: string, status?: string) {
    if (status && !INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
      throw new BadRequestException('Invalid status filter.');
    }

    return this.db.invoice.findMany({
      where: { companyId, ...(status ? { status: status as InvoiceStatus } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(companyId: string, id: string) {
    const invoice = await this.db.invoice.findFirst({
      where: { id, companyId },
      include: {
        sale: {
          include: {
            items: { include: { product: true } },
            customer: true,
          },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    return invoice;
  }

  async markPaid(companyId: string, id: string) {
    const invoice = await this.db.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    if (invoice.status === 'PAID') {
      throw new ConflictException('Invoice is already marked as paid.');
    }

    const [updatedInvoice] = await this.db.$transaction([
      this.db.invoice.update({ where: { id, companyId }, data: { status: 'PAID' } }),
      this.db.sale.update({ where: { id: invoice.saleId, companyId }, data: { paymentStatus: 'PAID' } }),
    ]);

    return updatedInvoice;
  }
}
