import { IsIn, IsInt, IsOptional, IsString, MaxLength, NotEquals } from 'class-validator';

const ADJUSTABLE_TYPES = ['PURCHASE', 'ADJUSTMENT', 'RETURN'] as const;

export class CreateInventoryAdjustmentDto {
  @IsString()
  productId!: string;

  // SALE is deliberately not selectable here — it's reserved for the future
  // Sales module to write internally through the same movement mechanism.
  @IsIn(ADJUSTABLE_TYPES)
  type!: (typeof ADJUSTABLE_TYPES)[number];

  @IsInt()
  @NotEquals(0)
  quantityChange!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
