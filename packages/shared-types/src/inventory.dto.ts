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

export interface StockReservationRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  orderId?: string;
}

export interface StockReservationResponse {
  reservationId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: 'RESERVED' | 'RELEASED' | 'FULFILLED';
  expiresAt: string;
}

export interface StockAdjustmentRequest {
  productId: string;
  warehouseId: string;
  quantityDelta: number;
  reason: 'RECEIVING' | 'CYCLE_COUNT' | 'DAMAGE' | 'MANUAL_CORRECTION';
}
