import { Injectable, NotFoundException } from '@nestjs/common';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  // See ProductsService.list() for why limit/offset are optional and additive.
  async list(companyId: string, pagination: PaginationDto = {}) {
    return this.db.supplier.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      ...(pagination.offset ? { skip: pagination.offset } : {}),
      ...(pagination.limit ? { take: pagination.limit } : {}),
    });
  }

  async getById(companyId: string, id: string) {
    const supplier = await this.db.supplier.findFirst({ where: { id, companyId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found.');
    }
    return supplier;
  }

  // Mirrors CustomersService.searchByName() — used by the AI tool registry's
  // propose_record_supplier_payment tool to resolve a name the user typed
  // into an actual supplier row before proposing a payment.
  async searchByName(companyId: string, name: string, limit = 5) {
    return this.db.supplier.findMany({
      where: { companyId, name: { contains: name, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async create(companyId: string, dto: CreateSupplierDto) {
    return this.db.supplier.create({ data: { companyId, ...dto } });
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto) {
    await this.getById(companyId, id);
    return this.db.supplier.update({ where: { id, companyId }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.getById(companyId, id);
    await this.db.supplier.delete({ where: { id, companyId } });
  }
}
