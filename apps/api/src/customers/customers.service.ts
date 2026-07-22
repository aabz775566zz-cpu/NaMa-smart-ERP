import { Injectable, NotFoundException } from '@nestjs/common';

import type { PaginationDto } from '../common/dto/pagination.dto';
import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly tenantPrisma: TenantGuardedPrismaService) {}

  private get db() {
    return this.tenantPrisma.client;
  }

  // See ProductsService.list() for why limit/offset are optional and additive.
  async list(companyId: string, pagination: PaginationDto = {}) {
    return this.db.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      ...(pagination.offset ? { skip: pagination.offset } : {}),
      ...(pagination.limit ? { take: pagination.limit } : {}),
    });
  }

  // Case-insensitive partial-name match, capped small — built for the AI
  // tool registry's "resolve a name the user typed in chat" use case, not a
  // general search endpoint (no route exposes this directly). Deliberately
  // returns the raw match list rather than picking a "best" one: disambiguation
  // between two customers sharing a name is a decision for the caller (the AI
  // tool asks the user), never silently guessed here.
  async searchByName(companyId: string, name: string, limit = 5) {
    return this.db.customer.findMany({
      where: { companyId, name: { contains: name, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
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
