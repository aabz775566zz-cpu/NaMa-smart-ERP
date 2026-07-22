import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Shared shape for every paginated list endpoint — mirrors
// ai/dto/list-conversations.dto.ts (the one module that already had this)
// exactly, promoted here so every other module reuses it instead of
// redeclaring the same four decorators. Omitted limit/offset preserves each
// endpoint's original behaviour (return everything) — this is additive,
// never a breaking change to an existing caller.
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
