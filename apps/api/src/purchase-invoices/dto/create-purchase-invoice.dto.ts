import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Unlike CreateSaleItemDto, unitCost IS client-supplied here — a purchase
// invoice's cost comes from the supplier's bill and varies invoice to
// invoice, unlike a sale's price which is always locked to the live
// Product.sellingPrice. Product.purchasePrice is only ever a prefill
// suggestion on the client, never authoritative for this input.
export class CreatePurchaseInvoiceItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;
}

// Deliberately no invoiceNumber field — it's system-generated (PINV-0001
// style) only when the invoice is received (see
// PurchaseInvoicesService.receive()), never accepted from the client. Same
// rule CreateSaleDto follows for anything server-computed.
export class CreatePurchaseInvoiceDto {
  @IsString()
  supplierId!: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxTotal?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseInvoiceItemDto)
  items!: CreatePurchaseInvoiceItemDto[];
}
