import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { PaymentsModule } from '../payments/payments.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PaymentsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, TenantGuardedPrismaService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
