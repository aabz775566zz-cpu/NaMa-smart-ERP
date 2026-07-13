import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CategoriesService } from './categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductRowDto } from './dto/import-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ImportRowResult {
  row: number;
  success: boolean;
  name: string;
  error?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly tenantPrisma: TenantGuardedPrismaService,
    private readonly inventoryService: InventoryService,
    private readonly categoriesService: CategoriesService,
  ) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async list(companyId: string) {
    return this.db.product.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async getById(companyId: string, id: string) {
    const product = await this.db.product.findFirst({ where: { id, companyId } });
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async create(companyId: string, userId: string, dto: CreateProductDto) {
    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.sku) {
      await this.assertSkuAvailable(companyId, dto.sku);
    }

    try {
      return await this.db.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            companyId,
            name: dto.name,
            description: dto.description,
            sku: dto.sku,
            imageUrl: dto.imageUrl,
            categoryId: dto.categoryId,
            purchasePrice: dto.purchasePrice,
            sellingPrice: dto.sellingPrice,
            unit: dto.unit,
            lowStockThreshold: dto.lowStockThreshold,
            status: dto.status,
          },
        });

        // Opt-in opening balance, written through the same audited
        // Inventory movement mechanism as every other stock change — lets a
        // shop owner enter "Rice 10kg, opening quantity 50" in one step
        // instead of creating the product then visiting Inventory to post
        // a separate PURCHASE adjustment.
        if (dto.openingQuantity && dto.openingQuantity > 0) {
          await this.inventoryService.applyMovementWithTx(tx, companyId, userId, {
            productId: product.id,
            type: 'PURCHASE',
            quantityChange: dto.openingQuantity,
            referenceType: 'PRODUCT_CREATION',
            note: 'Opening stock',
          });
          return tx.product.findFirstOrThrow({ where: { id: product.id, companyId } });
        }

        return product;
      });
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  // Bulk import — one row at a time, sequentially (not Promise.all), so two
  // rows sharing a SKU within the same file correctly reject the second one
  // instead of racing past the same pre-check simultaneously. Each row goes
  // through the exact same create() path a single manual product-creation
  // uses (category validation, SKU uniqueness, transactional opening-stock
  // movement), so a bulk import can never bypass a rule the regular form
  // enforces. One bad row is caught and recorded, not allowed to abort the
  // rows after it.
  async importRows(companyId: string, userId: string, rows: ImportProductRowDto[]): Promise<ImportRowResult[]> {
    const results: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        let categoryId: string | undefined;
        if (row.category?.trim()) {
          const category = await this.categoriesService.findOrCreateByName(companyId, row.category);
          categoryId = category.id;
        }

        await this.create(companyId, userId, {
          name: row.name,
          description: row.description,
          sku: row.sku,
          categoryId,
          purchasePrice: row.purchasePrice,
          sellingPrice: row.sellingPrice,
          unit: row.unit,
          openingQuantity: row.openingQuantity,
          lowStockThreshold: row.lowStockThreshold,
          status: row.status,
        });
        results.push({ row: i, success: true, name: row.name });
      } catch (error) {
        results.push({
          row: i,
          success: false,
          name: row.name,
          error: error instanceof Error ? error.message : 'Unknown error.',
        });
      }
    }

    return results;
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    await this.getById(companyId, id);

    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.sku) {
      await this.assertSkuAvailable(companyId, dto.sku, id);
    }

    try {
      return await this.db.product.update({ where: { id, companyId }, data: dto });
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  async remove(companyId: string, id: string) {
    await this.getById(companyId, id);
    try {
      await this.db.product.delete({ where: { id, companyId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          'This product has existing history and cannot be deleted. Mark it as DISCONTINUED instead.',
        );
      }
      throw error;
    }
  }

  private async assertCategoryBelongsToCompany(companyId: string, categoryId: string) {
    const category = await this.db.category.findFirst({ where: { id: categoryId, companyId } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
  }

  private async assertSkuAvailable(companyId: string, sku: string, excludeProductId?: string) {
    const existing = await this.db.product.findFirst({ where: { companyId, sku } });
    if (existing && existing.id !== excludeProductId) {
      throw new ConflictException('A product with this SKU already exists.');
    }
  }

  private translateUniqueViolation(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('A product with this SKU already exists.');
    }
    return error;
  }
}
