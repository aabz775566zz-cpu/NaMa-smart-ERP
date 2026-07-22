import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InvoiceStatus, Prisma } from '@prisma/client';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { PaymentsService } from '../payments/payments.service';

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
  constructor(
    private readonly tenantPrisma: TenantGuardedPrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

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

  // See ProductsService.list() for why limit/offset are optional and additive.
  async list(companyId: string, status?: string, pagination: PaginationDto = {}) {
    if (status && !INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
      throw new BadRequestException('Invalid status filter.');
    }

    return this.db.invoice.findMany({
      where: { companyId, ...(status ? { status: status as InvoiceStatus } : {}) },
      orderBy: { createdAt: 'desc' },
      ...(pagination.offset ? { skip: pagination.offset } : {}),
      ...(pagination.limit ? { take: pagination.limit } : {}),
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

  async markPaid(companyId: string, id: string, userId: string) {
    const invoice = await this.db.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }
    if (invoice.status === 'PAID') {
      throw new ConflictException('Invoice is already marked as paid.');
    }

    const sale = await this.db.sale.findFirst({ where: { id: invoice.saleId, companyId } });
    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }

    if (sale.customerId) {
      // Ledger-backed customer — record the sale's remaining balance as an
      // implicit payment so Payment stays the single source of truth, then
      // let the ledger reconcile status fields (see PaymentsService).
      await this.db.$transaction(async (tx) => {
        await this.paymentsService.settleSaleInFull(
          tx,
          companyId,
          { id: sale.id, customerId: sale.customerId },
          userId,
        );
      });
    } else {
      // Walk-in sale — no customer ledger involved, flip status directly.
      await this.db.$transaction([
        this.db.invoice.update({ where: { id, companyId }, data: { status: 'PAID' } }),
        this.db.sale.update({ where: { id: invoice.saleId, companyId }, data: { paymentStatus: 'PAID' } }),
      ]);
    }

    return this.db.invoice.findFirst({ where: { id, companyId } });
  }
}
