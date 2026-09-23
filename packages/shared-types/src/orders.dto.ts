import { z } from 'zod';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from './enums.js';

export const ShippingAddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const OrderItemInputSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});
export type CreateOrderItemInput = z.infer<typeof OrderItemInputSchema>;

export const CreateOrderRequestSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerEmail: z.string().email('Invalid customer email address'),
  shippingAddress: ShippingAddressSchema,
  items: z.array(OrderItemInputSchema).min(1, 'At least one item is required'),
  discountCode: z.string().optional(),
  billingAddress: z.record(z.string(), z.any()).optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
});
export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusSchema>;

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
