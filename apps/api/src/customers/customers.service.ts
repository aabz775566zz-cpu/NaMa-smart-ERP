import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  async list(companyId: string) {
    return this.db.customer.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async getById(companyId: string, id: string) {
    const customer = await this.db.customer.findFirst({ where: { id, companyId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
    return customer;
  }

  async create(companyId: string, dto: CreateCustomerDto) {
    return this.db.customer.create({ data: { companyId, ...dto } });
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    await this.getById(companyId, id);
    return this.db.customer.update({ where: { id, companyId }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.getById(companyId, id);
    await this.db.customer.delete({ where: { id, companyId } });
  }
}
