import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { InvoicesService } from './invoices.service';

// No POST /invoices — invoices are only ever auto-generated when a Sale
// completes (see SalesService.complete() -> InvoicesService.createForSaleWithTx).
@UseGuards(PermissionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @RequirePermission('INVOICES:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string, @Query('status') status?: string) {
    return this.invoicesService.list(companyId, status);
  }

  @RequirePermission('INVOICES:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.invoicesService.getById(companyId, id);
  }

  @RequirePermission('INVOICES:UPDATE')
  @HttpCode(HttpStatus.OK)
  @Post(':id/mark-paid')
  markPaid(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.markPaid(companyId, id, userId);
  }
}
