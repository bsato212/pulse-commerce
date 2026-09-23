import { createZodDto } from 'nestjs-zod';
import {
  OrderItemInputSchema,
  ShippingAddressSchema,
  CreateOrderRequestSchema,
  UpdateOrderStatusSchema,
} from '@pulsecommerce/shared-types';

export class OrderItemInputDto extends createZodDto(OrderItemInputSchema) {}
export class ShippingAddressDto extends createZodDto(ShippingAddressSchema) {}
export class CreateOrderDto extends createZodDto(CreateOrderRequestSchema) {}
export class UpdateOrderStatusDto extends createZodDto(UpdateOrderStatusSchema) {}
