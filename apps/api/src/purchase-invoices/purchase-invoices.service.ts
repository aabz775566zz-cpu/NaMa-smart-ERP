import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PurchaseInvoiceStatus } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { SupplierPaymentsService } from '../supplier-payments/supplier-payments.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';

const PURCHASE_INVOICE_STATUSES = ['DRAFT', 'RECEIVED', 'CANCELLED'] as const;

// Same narrow-interface pattern as InvoicesService's InvoiceTxClient —
// Prisma's Exact<> generic constraint on create/update/upsert rejects a
// loose object-bag type, so args stay `any` here; this interface exists to
// name the calls this service composes inside a transaction, not fully
// type them.
interface PurchaseInvoiceTxClient {
  purchaseInvoice: {
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  companyCounter: {
    upsert: (args: any) => Promise<{ value: number }>;
  };
}

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private readonly tenantPrisma: TenantGuardedPrismaService,
    private readonly inventoryService: InventoryService,
    private readonly supplierPaymentsService: SupplierPaymentsService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async list(companyId: string, status?: string) {
    if (status && !PURCHASE_INVOICE_STATUSES.includes(status as (typeof PURCHASE_INVOICE_STATUSES)[number])) {
      throw new BadRequestException('Invalid status filter.');
    }

    return this.db.purchaseInvoice.findMany({
      where: { companyId, ...(status ? { status: status as PurchaseInvoiceStatus } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(companyId: string, id: string) {
    const purchaseInvoice = await this.db.purchaseInvoice.findFirst({
      where: { id, companyId },
      include: { items: { include: { product: true } }, supplier: true },
    });
    if (!purchaseInvoice) {
      throw new NotFoundException('Purchase invoice not found.');
    }
    return purchaseInvoice;
  }

  // Creates a DRAFT only — no inventory movement, no invoiceNumber
  // assigned. Mirrors SalesService.create() exactly, substituting the price
  // source: a sale's price is always live Product.sellingPrice, a purchase
  // line's cost is client-supplied per invoice (see dto).
  async create(companyId: string, userId: string, dto: CreatePurchaseInvoiceDto) {
    const supplier = await this.db.supplier.findFirst({ where: { id: dto.supplierId, companyId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found.');
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.db.product.findMany({ where: { id: { in: productIds }, companyId } });
    const productById = new Map(products.map((product) => [product.id, product]));

    const missing = productIds.filter((id) => !productById.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Product(s) not found: ${missing.join(', ')}`);
    }

    // Money math stays in Decimal space throughout — never native JS floats
    // — same rule SalesService.create() follows.
    let subtotal = new Prisma.Decimal(0);
    const itemsData = dto.items.map((item) => {
      const unitCost = new Prisma.Decimal(item.unitCost);
      const lineTotal = unitCost.times(item.quantity);
      subtotal = subtotal.plus(lineTotal);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost,
        lineTotal,
        companyId,
      };
    });

    const discountTotal = new Prisma.Decimal(dto.discountTotal ?? 0);
    const taxTotal = new Prisma.Decimal(dto.taxTotal ?? 0);

    if (discountTotal.greaterThan(subtotal)) {
      throw new BadRequestException('discountTotal cannot exceed the purchase invoice subtotal.');
    }

    const totalAmount = subtotal.minus(discountTotal).plus(taxTotal);
    if (totalAmount.isNegative()) {
      throw new BadRequestException('Computed total cannot be negative.');
    }

    return this.db.purchaseInvoice.create({
      data: {
        companyId,
        supplierId: dto.supplierId,
        createdByUserId: userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        subtotal,
        discountTotal,
        taxTotal,
        totalAmount,
        items: { create: itemsData },
      },
      include: { items: true },
    });
  }

  // Mirrors SalesService.complete() exactly: all-or-nothing inside one
  // transaction — if any line item's stock movement fails, or numbering
  // fails, the whole thing rolls back and the invoice stays DRAFT.
  async receive(companyId: string, userId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      const client = tx as unknown as PurchaseInvoiceTxClient;

      const purchaseInvoice = await client.purchaseInvoice.findFirst({
        where: { id, companyId },
        include: { items: true },
      });
      if (!purchaseInvoice) {
        throw new NotFoundException('Purchase invoice not found.');
      }
      if (purchaseInvoice.status !== 'DRAFT') {
        throw new ConflictException('Only a DRAFT purchase invoice can be received.');
      }

      for (const item of purchaseInvoice.items) {
        await this.inventoryService.applyMovementWithTx(tx, companyId, userId, {
          productId: item.productId,
          type: 'PURCHASE',
          quantityChange: item.quantity,
          referenceType: 'PURCHASE_INVOICE',
          referenceId: purchaseInvoice.id,
        });
      }

      // Numbering happens last, atomically with the status flip — mirrors
      // InvoicesService.createForSaleWithTx's upsert-counter pattern exactly,
      // just keyed by a different counterKey on the same CompanyCounter table.
      const counter = await client.companyCounter.upsert({
        where: { companyId_counterKey: { companyId, counterKey: 'PURCHASE_INVOICE' } },
        create: { companyId, counterKey: 'PURCHASE_INVOICE', value: 1 },
        update: { value: { increment: 1 } },
      });
      const invoiceNumber = `PINV-${String(counter.value).padStart(4, '0')}`;

      return client.purchaseInvoice.update({
        where: { id: purchaseInvoice.id, companyId },
        data: { status: 'RECEIVED', invoiceNumber },
        include: { items: true },
      });
    });
  }

  // Mirrors SalesService.cancel() exactly — only a DRAFT can be cancelled;
  // no inventory reversal needed since DRAFT never touched stock.
  async cancel(companyId: string, id: string) {
    const purchaseInvoice = await this.db.purchaseInvoice.findFirst({ where: { id, companyId } });
    if (!purchaseInvoice) {
      throw new NotFoundException('Purchase invoice not found.');
    }
    if (purchaseInvoice.status !== 'DRAFT') {
      throw new ConflictException('Only a DRAFT purchase invoice can be cancelled.');
    }
    return this.db.purchaseInvoice.update({ where: { id, companyId }, data: { status: 'CANCELLED' } });
  }

  // Records the invoice's remaining balance as an implicit SupplierPayment
  // and lets the ledger reconcile paymentStatus — mirrors
  // InvoicesService.markPaid()'s customer-ledger branch exactly. No
  // walk-in-style direct-flip branch is needed here (unlike Invoices),
  // since every PurchaseInvoice always has a required supplierId.
  async markPaid(companyId: string, userId: string, id: string) {
    const purchaseInvoice = await this.db.purchaseInvoice.findFirst({ where: { id, companyId } });
    if (!purchaseInvoice) {
      throw new NotFoundException('Purchase invoice not found.');
    }
    if (purchaseInvoice.status !== 'RECEIVED') {
      throw new ConflictException('Only a RECEIVED purchase invoice can be marked as paid.');
    }
    if (purchaseInvoice.paymentStatus === 'PAID') {
      throw new ConflictException('Purchase invoice is already marked as paid.');
    }

    await this.db.$transaction(async (tx) => {
      await this.supplierPaymentsService.settlePurchaseInvoiceInFull(
        tx,
        companyId,
        { id: purchaseInvoice.id, supplierId: purchaseInvoice.supplierId },
        userId,
      );
    });

    return this.db.purchaseInvoice.findFirst({ where: { id, companyId } });
  }
}
