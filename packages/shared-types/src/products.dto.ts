import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().default(''),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
});
export type CreateProductRequest = z.infer<typeof CreateProductSchema>;

export const UpdateProductPriceSchema = z.object({
  price: z.number().positive('Price must be positive'),
});
export type UpdateProductPriceRequest = z.infer<typeof UpdateProductPriceSchema>;

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).optional().default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export interface ProductDTO {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  categoryId: string;
  categoryName?: string;
  active: boolean;
  totalAvailableStock?: number;
  createdAt: string;
  updatedAt: string;
}
