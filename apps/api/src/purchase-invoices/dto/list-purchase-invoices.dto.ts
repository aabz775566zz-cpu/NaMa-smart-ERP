import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

// See sales/dto/list-sales.dto.ts for why status and pagination must be one
// combined DTO. Status validated against PURCHASE_INVOICE_STATUSES in
// PurchaseInvoicesService.list(), not duplicated here.
export class ListPurchaseInvoicesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;
}
