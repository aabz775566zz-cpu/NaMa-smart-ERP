import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'] as const;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Optional — multiple products without a SKU are fine (see schema note on
  // Product.@@unique([companyId, sku])). Uniqueness is only enforced once set.
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  // quantityOnHand itself is still never settable directly — this is an
  // opt-in opening balance, written through the same audited Inventory
  // movement mechanism as every other stock change (ProductsService.create()
  // posts a PURCHASE movement in the same transaction when this is > 0),
  // never a raw column write.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  openingQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: (typeof PRODUCT_STATUSES)[number];
}
