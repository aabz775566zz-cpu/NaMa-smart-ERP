import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@UseGuards(PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @RequirePermission('SALES:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string, @Query('status') status?: string) {
    return this.salesService.list(companyId, status);
  }

  @RequirePermission('SALES:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.salesService.getById(companyId, id);
  }

  @RequirePermission('SALES:CREATE')
  @Post()
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(companyId, userId, dto);
  }

  // Uses SALES:CREATE (not UPDATE) — EMPLOYEE has CREATE+READ but not UPDATE,
  // and completing a sale is part of the same cashier workflow as creating
  // one. See architecture plan for the reasoning.
  @RequirePermission('SALES:CREATE')
  @HttpCode(HttpStatus.OK)
  @Post(':id/complete')
  complete(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.complete(companyId, userId, id);
  }

  // Uses SALES:DELETE — only MANAGER/OWNER can void a draft; matches the
  // permission reserved for exactly this purpose in the Phase 3 architecture
  // plan and Inventory module notes.
  @RequirePermission('SALES:DELETE')
  @HttpCode(HttpStatus.OK)
  @Post(':id/cancel')
  cancel(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.salesService.cancel(companyId, id);
  }
}
