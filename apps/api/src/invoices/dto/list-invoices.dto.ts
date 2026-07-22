import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

// See sales/dto/list-sales.dto.ts for why status and pagination must be one
// combined DTO. Status validated against INVOICE_STATUSES in
// InvoicesService.list(), not duplicated here.
export class ListInvoicesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;
}
