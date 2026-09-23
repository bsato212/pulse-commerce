import { createZodDto } from 'nestjs-zod';
import {
  StockAdjustmentRequestSchema,
  StockReservationRequestSchema,
} from '@pulsecommerce/shared-types';

export enum AdjustmentReason {
  RECEIVING = 'RECEIVING',
  CYCLE_COUNT = 'CYCLE_COUNT',
  DAMAGE = 'DAMAGE',
  MANUAL_CORRECTION = 'MANUAL_CORRECTION',
}

export class StockAdjustmentDto extends createZodDto(StockAdjustmentRequestSchema) {}
export class ReserveStockDto extends createZodDto(StockReservationRequestSchema) {}
