import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

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

  async create(companyId: string, dto: CreateProductDto) {
    if (dto.categoryId) {
      await this.assertCategoryBelongsToCompany(companyId, dto.categoryId);
    }
    if (dto.sku) {
      await this.assertSkuAvailable(companyId, dto.sku);
    }

    try {
      return await this.db.product.create({
        data: {
          companyId,
          name: dto.name,
          description: dto.description,
          sku: dto.sku,
          imageUrl: dto.imageUrl,
          categoryId: dto.categoryId,
          purchasePrice: dto.purchasePrice,
          sellingPrice: dto.sellingPrice,
          lowStockThreshold: dto.lowStockThreshold,
          status: dto.status,
        },
      });
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
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
