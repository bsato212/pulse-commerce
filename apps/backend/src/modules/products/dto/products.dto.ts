import { createZodDto } from 'nestjs-zod';
import {
  CreateProductSchema,
  UpdateProductPriceSchema,
  ProductListQuerySchema,
} from '@pulsecommerce/shared-types';

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductPriceDto extends createZodDto(UpdateProductPriceSchema) {}
export class ProductQueryDto extends createZodDto(ProductListQuerySchema) {}
