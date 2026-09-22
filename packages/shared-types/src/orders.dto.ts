import { OrderStatus, PaymentStatus, FulfillmentStatus } from './enums.js';

export interface OrderItemDTO {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxAmount?: number;
  subtotal?: number;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId?: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: CreateOrderItemInput[];
  discountCode?: string;
}

export interface OrderPricingSummary {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
}

export interface OrderResponse extends OrderPricingSummary {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}
