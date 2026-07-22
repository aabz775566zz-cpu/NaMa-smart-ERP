import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

// Combines the existing ?status filter with pagination into one DTO — the
// global ValidationPipe's forbidNonWhitelisted rejects the whole request if
// two separate @Query() bindings each validate against the full query
// object, so status and pagination can't stay split once pagination needs
// its own DTO. Status is deliberately just IsString here, not IsIn(...) —
// SalesService.list() already validates it against SALE_STATUSES and throws
// a BadRequestException with a clearer message; duplicating that enum here
// would just be two places that can drift.
export class ListSalesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;
}
