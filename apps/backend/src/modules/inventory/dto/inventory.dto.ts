import { IsString, IsInt, IsOptional, Min, IsEnum } from 'class-validator';

export enum AdjustmentReason {
  RECEIVING = 'RECEIVING',
  CYCLE_COUNT = 'CYCLE_COUNT',
  DAMAGE = 'DAMAGE',
  MANUAL_CORRECTION = 'MANUAL_CORRECTION',
}

export class StockAdjustmentDto {
  @IsString()
  warehouseId: string;

  @IsString()
  productId: string;

  @IsInt()
  quantityDelta: number;

  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;
}

export class ReserveStockDto {
  @IsString()
  productId: string;

  @IsString()
  warehouseId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  orderId?: string;
}
