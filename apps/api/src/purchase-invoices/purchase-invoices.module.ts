import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoicesService } from './purchase-invoices.service';

@Module({
  imports: [InventoryModule],
  controllers: [PurchaseInvoicesController],
  providers: [PurchaseInvoicesService, TenantGuardedPrismaService],
})
export class PurchaseInvoicesModule {}
