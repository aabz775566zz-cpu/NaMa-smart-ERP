import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { SupplierPaymentsService } from './supplier-payments.service';

// Nested under /suppliers — a payment always belongs to a supplier ledger,
// mirroring PaymentsController's /customers/:customerId sub-resource style.
@UseGuards(PermissionsGuard)
@Controller('suppliers/:supplierId')
export class SupplierPaymentsController {
  constructor(private readonly supplierPaymentsService: SupplierPaymentsService) {}

  @RequirePermission('SUPPLIERS:READ')
  @Get('ledger')
  getLedger(@CurrentUser('companyId') companyId: string, @Param('supplierId') supplierId: string) {
    return this.supplierPaymentsService.getLedger(companyId, supplierId);
  }

  // Gated by PURCHASES:UPDATE — mirrors PaymentsController's choice to gate
  // on INVOICES:UPDATE (recording a payment is that same capability made
  // more granular: partial amounts instead of an all-or-nothing flip).
  @RequirePermission('PURCHASES:UPDATE')
  @Post('payments')
  recordPayment(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateSupplierPaymentDto,
  ) {
    return this.supplierPaymentsService.recordPayment(companyId, supplierId, userId, dto);
  }
}
