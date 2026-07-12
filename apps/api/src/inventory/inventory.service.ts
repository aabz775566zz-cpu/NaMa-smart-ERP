import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InventoryMovementType } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';

interface ApplyMovementParams {
  productId: string;
  type: InventoryMovementType;
  quantityChange: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
}

// Minimal shape the shared movement logic needs from a Prisma transaction
// client — narrow on purpose so it works equally whether the tx comes from
// this service's own $transaction() or one another module (Sales) already
// owns and is composing a larger operation around. Prisma's generated methods
// use an `Exact<>` generic constraint that rejects a plain object-bag type
// like `Record<string, unknown>` for `args`, so those stay `any` here — this
// interface's job is just to name the three calls used, not fully type them.
interface MovementTxClient {
  product: {
    updateMany: (args: any) => Promise<{ count: number }>;
    findFirst: (args: any) => Promise<{ id: string } | null>;
  };
  inventoryMovement: {
    create: (args: any) => Promise<unknown>;
  };
}

@Injectable()
export class InventoryService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async applyMovement(companyId: string, userId: string, dto: CreateInventoryAdjustmentDto) {
    if ((dto.type === 'PURCHASE' || dto.type === 'RETURN') && dto.quantityChange < 0) {
      throw new BadRequestException(`${dto.type} movements must have a positive quantityChange.`);
    }

    return this.db.$transaction((tx) =>
      this.applyMovementInTx(tx, companyId, userId, {
        productId: dto.productId,
        type: dto.type,
        quantityChange: dto.quantityChange,
        note: dto.note,
      }),
    );
  }

  // For other modules (Sales) that need this exact atomic guarantee inside a
  // transaction they already own, spanning more than just this one movement
  // (e.g. completing a sale = N movements + a Sale status update, all or
  // nothing). Public DTO, permissions, and HTTP surface are unchanged —
  // this is purely an internal service-to-service entry point.
  async applyMovementWithTx(
    tx: MovementTxClient,
    companyId: string,
    userId: string,
    params: ApplyMovementParams,
  ) {
    return this.applyMovementInTx(tx, companyId, userId, params);
  }

  private async applyMovementInTx(
    tx: MovementTxClient,
    companyId: string,
    userId: string,
    params: ApplyMovementParams,
  ) {
    const updateResult = await tx.product.updateMany({
      where: {
        id: params.productId,
        companyId,
        ...(params.quantityChange < 0 ? { quantityOnHand: { gte: -params.quantityChange } } : {}),
      },
      data: { quantityOnHand: { increment: params.quantityChange } },
    });

    if (updateResult.count === 0) {
      const exists = await tx.product.findFirst({ where: { id: params.productId, companyId } });
      if (!exists) {
        throw new NotFoundException('Product not found.');
      }
      throw new ConflictException('Insufficient stock for this adjustment.');
    }

    return tx.inventoryMovement.create({
      data: {
        companyId,
        productId: params.productId,
        type: params.type,
        quantityChange: params.quantityChange,
        note: params.note,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        createdByUserId: userId,
      },
    });
  }

  async listMovements(companyId: string, productId?: string) {
    return this.db.inventoryMovement.findMany({
      where: { companyId, ...(productId ? { productId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listLowStock(companyId: string) {
    const products = await this.db.product.findMany({
      where: { companyId, lowStockThreshold: { not: null } },
    });
    // Column-to-column comparison (quantityOnHand <= lowStockThreshold) isn't
    // expressible in Prisma's query builder against a literal, and a raw
    // query isn't worth it at MVP catalog sizes — filtered in application code.
    return products.filter(
      (product) => product.lowStockThreshold != null && product.quantityOnHand <= product.lowStockThreshold,
    );
  }
}
