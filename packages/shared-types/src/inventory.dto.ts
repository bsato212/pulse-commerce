import { z } from 'zod';

export const StockAdjustmentReasonEnum = z.enum([
  'RECEIVING',
  'CYCLE_COUNT',
  'DAMAGE',
  'MANUAL_CORRECTION',
]);
export type StockAdjustmentReason = z.infer<typeof StockAdjustmentReasonEnum>;

export const StockAdjustmentRequestSchema = z.object({
  warehouseId: z.string().uuid('Warehouse ID must be a valid UUID'),
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantityDelta: z.number().int('Quantity delta must be an integer'),
  reason: StockAdjustmentReasonEnum,
});
export type StockAdjustmentRequest = z.infer<typeof StockAdjustmentRequestSchema>;

export const StockReservationRequestSchema = z.object({
  warehouseId: z.string().uuid('Warehouse ID must be a valid UUID'),
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  orderId: z.string().uuid('Order ID must be a valid UUID').optional(),
});
export type StockReservationRequest = z.infer<typeof StockReservationRequestSchema>;

export interface WarehouseStockDTO {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
}

export interface StockReservationResponse {
  reservationId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: 'RESERVED' | 'RELEASED' | 'FULFILLED';
  expiresAt: string;
}
