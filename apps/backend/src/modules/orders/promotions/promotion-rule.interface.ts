export interface PromotionContext {
  customerId?: string;
  items: Array<{
    productId: string;
    categoryId?: string;
    unitPrice: number;
    quantity: number;
  }>;
  subtotal: number;
}

export interface PromotionDiscountResult {
  ruleName: string;
  discountAmount: number;
  description: string;
}

export interface PromotionRuleStrategy {
  readonly code: string;
  readonly priority: number;
  evaluate(context: PromotionContext): Promise<PromotionDiscountResult | null>;
}
