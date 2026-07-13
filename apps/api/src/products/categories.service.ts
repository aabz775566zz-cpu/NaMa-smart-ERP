import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async list(companyId: string) {
    return this.db.category.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async getById(companyId: string, id: string) {
    const category = await this.db.category.findFirst({ where: { id, companyId } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  async create(companyId: string, dto: CreateCategoryDto) {
    try {
      return await this.db.category.create({ data: { companyId, name: dto.name } });
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  // Used by bulk product import — a CSV only has category *names*, never
  // internal IDs, so each row's category is resolved (or created on first
  // use) rather than requiring every category to exist beforehand. Matches
  // the @@unique([companyId, name]) constraint case-insensitively so
  // "Snacks" and "snacks" resolve to the same row instead of duplicating it.
  async findOrCreateByName(companyId: string, name: string) {
    const trimmed = name.trim();
    const existing = await this.db.category.findFirst({
      where: { companyId, name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) return existing;

    try {
      return await this.db.category.create({ data: { companyId, name: trimmed } });
    } catch (error) {
      // A concurrent import row (or a second in-flight request) may have
      // just created the same category — re-fetch rather than fail the row.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const created = await this.db.category.findFirst({
          where: { companyId, name: { equals: trimmed, mode: 'insensitive' } },
        });
        if (created) return created;
      }
      throw error;
    }
  }

  async update(companyId: string, id: string, dto: UpdateCategoryDto) {
    await this.getById(companyId, id);
    try {
      return await this.db.category.update({ where: { id, companyId }, data: dto });
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  async remove(companyId: string, id: string) {
    await this.getById(companyId, id);
    try {
      await this.db.category.delete({ where: { id, companyId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('This category still has products assigned to it.');
      }
      throw error;
    }
  }

  private translateUniqueViolation(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('A category with this name already exists.');
    }
    return error;
  }
}
