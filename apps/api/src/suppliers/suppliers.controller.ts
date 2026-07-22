import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@UseGuards(PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @RequirePermission('SUPPLIERS:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string, @Query() pagination: PaginationDto) {
    return this.suppliersService.list(companyId, pagination);
  }

  @RequirePermission('SUPPLIERS:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.suppliersService.getById(companyId, id);
  }

  @RequirePermission('SUPPLIERS:CREATE')
  @Post()
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(companyId, dto);
  }

  @RequirePermission('SUPPLIERS:UPDATE')
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(companyId, id, dto);
  }

  @RequirePermission('SUPPLIERS:DELETE')
  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.suppliersService.remove(companyId, id);
  }
}
