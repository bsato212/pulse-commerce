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

export interface UpdateProductPriceRequest {
  price: number;
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}
