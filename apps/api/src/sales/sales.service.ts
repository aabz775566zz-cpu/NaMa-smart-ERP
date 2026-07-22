import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SaleStatus } from '@prisma/client';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateSaleDto } from './dto/create-sale.dto';

const SALE_STATUSES = ['DRAFT', 'COMPLETED', 'CANCELLED'] as const;

@Injectable()
export class SalesService {
  constructor(
    private readonly tenantPrisma: TenantGuardedPrismaService,
    private readonly inventoryService: InventoryService,
    private readonly invoicesService: InvoicesService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  // See ProductsService.list() for why limit/offset are optional and additive.
  async list(companyId: string, status?: string, pagination: PaginationDto = {}) {
    if (status && !SALE_STATUSES.includes(status as (typeof SALE_STATUSES)[number])) {
      throw new BadRequestException('Invalid status filter.');
    }

    return this.db.sale.findMany({
      where: { companyId, ...(status ? { status: status as SaleStatus } : {}) },
      orderBy: { createdAt: 'desc' },
      ...(pagination.offset ? { skip: pagination.offset } : {}),
      ...(pagination.limit ? { take: pagination.limit } : {}),
    });
  }

  async getById(companyId: string, id: string) {
    const sale = await this.db.sale.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }
    return sale;
  }

  async create(companyId: string, userId: string, dto: CreateSaleDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.db.product.findMany({ where: { id: { in: productIds }, companyId } });
    const productById = new Map(products.map((product) => [product.id, product]));

    const missing = productIds.filter((id) => !productById.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Product(s) not found: ${missing.join(', ')}`);
    }

    if (dto.customerId) {
      const customer = await this.db.customer.findFirst({ where: { id: dto.customerId, companyId } });
      if (!customer) {
        throw new NotFoundException('Customer not found.');
      }
    }

    // Money math stays in Decimal space throughout — never native JS floats —
    // to avoid the rounding-error bug class that plain number arithmetic
    // introduces on currency values.
    let subtotal = new Prisma.Decimal(0);
    const itemsData = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      const lineTotal = product.sellingPrice.times(item.quantity);
      subtotal = subtotal.plus(lineTotal);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        lineTotal,
        companyId,
      };
    });

    const discountTotal = new Prisma.Decimal(dto.discountTotal ?? 0);
    const taxTotal = new Prisma.Decimal(dto.taxTotal ?? 0);

    if (discountTotal.greaterThan(subtotal)) {
      throw new BadRequestException('discountTotal cannot exceed the sale subtotal.');
    }

    const totalAmount = subtotal.minus(discountTotal).plus(taxTotal);
    if (totalAmount.isNegative()) {
      throw new BadRequestException('Computed total cannot be negative.');
    }

    return this.db.sale.create({
      data: {
        companyId,
        customerId: dto.customerId,
        createdByUserId: userId,
        subtotal,
        discountTotal,
        taxTotal,
        totalAmount,
        paymentMethod: dto.paymentMethod ?? 'CASH',
        paymentStatus: dto.paymentStatus ?? 'UNPAID',
        items: { create: itemsData },
      },
      include: { items: true },
    });
  }

  async complete(companyId: string, userId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, companyId }, include: { items: true } });
      if (!sale) {
        throw new NotFoundException('Sale not found.');
      }
      if (sale.status !== 'DRAFT') {
        throw new ConflictException('Only a DRAFT sale can be completed.');
      }

      // All-or-nothing: if any line item lacks stock, or invoice creation
      // fails, this whole transaction rolls back — no partial stock
      // decrements, no orphan invoice, sale stays DRAFT.
      for (const item of sale.items) {
        await this.inventoryService.applyMovementWithTx(tx, companyId, userId, {
          productId: item.productId,
          type: 'SALE',
          quantityChange: -item.quantity,
          referenceType: 'SALE',
          referenceId: sale.id,
        });
      }

      const updatedSale = await tx.sale.update({
        where: { id: sale.id, companyId },
        data: { status: 'COMPLETED' },
        include: { items: true },
      });

      const invoice = await this.invoicesService.createForSaleWithTx(tx, companyId, {
        id: updatedSale.id,
        totalAmount: updatedSale.totalAmount,
      });

      return { ...updatedSale, invoice };
    });
  }

  async cancel(companyId: string, id: string) {
    const sale = await this.db.sale.findFirst({ where: { id, companyId } });
    if (!sale) {
      throw new NotFoundException('Sale not found.');
    }
    if (sale.status !== 'DRAFT') {
      throw new ConflictException('Only a DRAFT sale can be cancelled.');
    }
    return this.db.sale.update({ where: { id, companyId }, data: { status: 'CANCELLED' } });
  }
}
