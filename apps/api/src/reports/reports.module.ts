import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [InventoryModule],
  controllers: [ReportsController],
  providers: [ReportsService, TenantGuardedPrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}
