import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Categories are a sub-resource of Products, reusing the PRODUCTS:* permission
// keys already seeded in Phase 2 rather than a separate CATEGORIES module.
@UseGuards(PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @RequirePermission('PRODUCTS:READ')
  @Get()
  list(@CurrentUser('companyId') companyId: string) {
    return this.categoriesService.list(companyId);
  }

  @RequirePermission('PRODUCTS:READ')
  @Get(':id')
  getById(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.categoriesService.getById(companyId, id);
  }

  @RequirePermission('PRODUCTS:CREATE')
  @Post()
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(companyId, dto);
  }

  @RequirePermission('PRODUCTS:UPDATE')
  @Patch(':id')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(companyId, id, dto);
  }

  @RequirePermission('PRODUCTS:DELETE')
  @Delete(':id')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.categoriesService.remove(companyId, id);
  }
}
