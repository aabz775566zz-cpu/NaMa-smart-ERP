import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductsDto } from './dto/import-products.dto';
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
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(companyId, userId, dto);
  }

  // No dedicated PRODUCTS:IMPORT permission — bulk-creating products is the
  // same capability as creating one, just in a loop, so it's gated on the
  // same PRODUCTS:CREATE grant (same reasoning as reusing INVOICES:UPDATE
  // for recording a payment in Phase 4).
  @RequirePermission('PRODUCTS:CREATE')
  @Post('import')
  importRows(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ImportProductsDto,
  ) {
    return this.productsService.importRows(companyId, userId, dto.rows);
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
