import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { SupplierPaymentsController } from './supplier-payments.controller';
import { SupplierPaymentsService } from './supplier-payments.service';

@Module({
  controllers: [SupplierPaymentsController],
  providers: [SupplierPaymentsService, TenantGuardedPrismaService],
  exports: [SupplierPaymentsService],
})
export class SupplierPaymentsModule {}
