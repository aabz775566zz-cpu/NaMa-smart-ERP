import { IsDateString, IsOptional } from 'class-validator';

export class DailyCloseReportDto {
  // Date-only (e.g. "2026-07-13"), not a full ISO timestamp — the report is
  // always scoped to one calendar day. Defaults to today (server-local) when
  // omitted, matching the rest of this service's un-timezone-aware
  // convention (see ReportsService.getDashboard()'s startOfMonth).
  @IsOptional()
  @IsDateString()
  date?: string;
}
