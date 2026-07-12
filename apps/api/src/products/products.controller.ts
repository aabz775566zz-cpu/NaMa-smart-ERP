import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@UseGuards(PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @RequirePermission('PRODUCTS:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string) {
    return this.productsService.list(companyId);
  }

  @RequirePermission('PRODUCTS:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.productsService.getById(companyId, id);
  }

  @RequirePermission('PRODUCTS:CREATE')
  @Post()
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(companyId, dto);
  }

  @RequirePermission('PRODUCTS:UPDATE')
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(companyId, id, dto);
  }

  @RequirePermission('PRODUCTS:DELETE')
  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.productsService.remove(companyId, id);
  }
}
