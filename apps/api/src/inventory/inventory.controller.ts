import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { InventoryService } from './inventory.service';

@UseGuards(PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermission('INVENTORY:CREATE')
  @Post('adjustments')
  createAdjustment(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateInventoryAdjustmentDto,
  ) {
    return this.inventoryService.applyMovement(companyId, userId, dto);
  }

  @RequirePermission('INVENTORY:READ')
  @Get('movements')
  listMovements(@CurrentUser('companyId') companyId: string, @Query('productId') productId?: string) {
    return this.inventoryService.listMovements(companyId, productId);
  }

  @RequirePermission('INVENTORY:READ')
  @Get('low-stock')
  listLowStock(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.listLowStock(companyId);
  }
}
