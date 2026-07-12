import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @RequirePermission('CUSTOMERS:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string) {
    return this.customersService.list(companyId);
  }

  @RequirePermission('CUSTOMERS:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.customersService.getById(companyId, id);
  }

  @RequirePermission('CUSTOMERS:CREATE')
  @Post()
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(companyId, dto);
  }

  @RequirePermission('CUSTOMERS:UPDATE')
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(companyId, id, dto);
  }

  @RequirePermission('CUSTOMERS:DELETE')
  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.customersService.remove(companyId, id);
  }
}
