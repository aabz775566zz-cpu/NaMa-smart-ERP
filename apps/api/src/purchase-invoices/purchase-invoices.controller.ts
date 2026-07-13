import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { PurchaseInvoicesService } from './purchase-invoices.service';

@UseGuards(PermissionsGuard)
@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(private readonly purchaseInvoicesService: PurchaseInvoicesService) {}

  @RequirePermission('PURCHASES:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string, @Query('status') status?: string) {
    return this.purchaseInvoicesService.list(companyId, status);
  }

  @RequirePermission('PURCHASES:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.purchaseInvoicesService.getById(companyId, id);
  }

  @RequirePermission('PURCHASES:CREATE')
  @Post()
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoicesService.create(companyId, userId, dto);
  }

  // Uses PURCHASES:CREATE (not UPDATE) — mirrors SalesController's
  // complete(): receiving is part of the same create-a-purchase workflow,
  // not a separate edit action.
  @RequirePermission('PURCHASES:CREATE')
  @HttpCode(HttpStatus.OK)
  @Post(':id/receive')
  receive(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.purchaseInvoicesService.receive(companyId, userId, id);
  }

  // Uses PURCHASES:DELETE — mirrors SalesController's cancel(): voiding a
  // draft is a step above create-level.
  @RequirePermission('PURCHASES:DELETE')
  @HttpCode(HttpStatus.OK)
  @Post(':id/cancel')
  cancel(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.purchaseInvoicesService.cancel(companyId, id);
  }

  // Uses PURCHASES:UPDATE — mirrors InvoicesController's markPaid().
  @RequirePermission('PURCHASES:UPDATE')
  @HttpCode(HttpStatus.OK)
  @Post(':id/mark-paid')
  markPaid(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.purchaseInvoicesService.markPaid(companyId, userId, id);
  }
}
