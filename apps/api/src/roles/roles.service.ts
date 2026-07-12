import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSystemRoles() {
    return this.prisma.role.findMany({
      where: { companyId: null },
      include: { permissions: { include: { permission: true } } },
    });
  }
}
