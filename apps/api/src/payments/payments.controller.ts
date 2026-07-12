import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

// Nested under /customers — a payment always belongs to a customer ledger,
// mirroring the CustomersController's :id sub-resource style.
@UseGuards(PermissionsGuard)
@Controller('customers/:customerId')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @RequirePermission('CUSTOMERS:READ')
  @Get('ledger')
  getLedger(@CurrentUser('companyId') companyId: string, @Param('customerId') customerId: string) {
    return this.paymentsService.getLedger(companyId, customerId);
  }

  // Gated by INVOICES:UPDATE — the same capability the existing mark-paid
  // endpoint uses, since recording a payment is that same capability made
  // more granular (partial amounts instead of an all-or-nothing flip).
  @RequirePermission('INVOICES:UPDATE')
  @Post('payments')
  recordPayment(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('customerId') customerId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.recordPayment(companyId, customerId, userId, dto);
  }
}
