import { Module } from '@nestjs/common';

import { TenantGuardedPrismaService } from '../common/prisma/tenant-guarded-prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [InventoryModule],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService, TenantGuardedPrismaService],
})
export class ProductsModule {}
