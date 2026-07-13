import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { DailyCloseReportDto } from './dto/daily-close-report.dto';
import { ReportDateRangeDto } from './dto/report-date-range.dto';
import { ReportsService } from './reports.service';

// Every endpoint in this controller uses the same permission, so it's
// declared once at the class level instead of repeated per method.
@UseGuards(PermissionsGuard)
@RequirePermission('REPORTS:READ')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('companyId') companyId: string) {
    return this.reportsService.getDashboard(companyId);
  }

  @Get('sales')
  getSalesReport(@CurrentUser('companyId') companyId: string, @Query() query: ReportDateRangeDto) {
    return this.reportsService.getSalesReport(companyId, query);
  }

  @Get('products')
  getProductsReport(@CurrentUser('companyId') companyId: string, @Query() query: ReportDateRangeDto) {
    return this.reportsService.getProductsReport(companyId, query);
  }

  @Get('customers')
  getCustomersReport(@CurrentUser('companyId') companyId: string, @Query() query: ReportDateRangeDto) {
    return this.reportsService.getCustomersReport(companyId, query);
  }

  @Get('inventory')
  getInventoryReport(@CurrentUser('companyId') companyId: string) {
    return this.reportsService.getInventoryReport(companyId);
  }

  @Get('daily-close')
  getDailyCloseReport(@CurrentUser('companyId') companyId: string, @Query() query: DailyCloseReportDto) {
    return this.reportsService.getDailyCloseReport(companyId, query);
  }
}
