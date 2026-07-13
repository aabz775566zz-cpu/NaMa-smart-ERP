import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async list(companyId: string) {
    return this.db.supplier.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async getById(companyId: string, id: string) {
    const supplier = await this.db.supplier.findFirst({ where: { id, companyId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found.');
    }
    return supplier;
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
