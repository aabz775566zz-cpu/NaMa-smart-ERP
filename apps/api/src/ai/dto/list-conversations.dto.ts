import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Reused for both GET /ai/conversations (pagination over conversations) and
// GET /ai/conversations/:id (pagination over that conversation's messages) —
// identical shape, no need for two near-duplicate DTOs.
export class ListConversationsDto {
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
