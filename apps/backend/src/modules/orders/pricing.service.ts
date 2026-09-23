import { Injectable } from '@nestjs/common';

export interface LineItemCalculationInput {
  productId: string;
  unitPrice: number;
  quantity: number;
}

export interface CalculatedLineItem {
  productId: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface OrderPricingResult {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  items: CalculatedLineItem[];
}

@Injectable()
export class PricingService {
  private readonly DEFAULT_TAX_RATE_PERCENT = 8.5; // 8.5%
  private readonly DEFAULT_SHIPPING_FLAT_RATE = 15.0;

  calculateOrderTotals(
    items: LineItemCalculationInput[],
    discountPercent: number = 0,
    customShippingRate?: number,
  ): OrderPricingResult {
    const shippingTotal =
      customShippingRate !== undefined ? customShippingRate : this.DEFAULT_SHIPPING_FLAT_RATE;

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const calculatedItems: CalculatedLineItem[] = [];

    for (const item of items) {
      const rawLineTotal = item.unitPrice * item.quantity;
      subtotal += rawLineTotal;

      // Calculate line-level discount and tax allocations
      const lineDiscount = Math.round(rawLineTotal * (discountPercent / 100) * 100) / 100;
      const taxableAmount = rawLineTotal - lineDiscount;
      const lineTax = Math.round(taxableAmount * (this.DEFAULT_TAX_RATE_PERCENT / 100) * 100) / 100;

      totalDiscount += lineDiscount;
      totalTax += lineTax;

      calculatedItems.push({
        productId: item.productId,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: rawLineTotal,
        discountAmount: lineDiscount,
        taxAmount: lineTax,
        lineTotal: rawLineTotal - lineDiscount + lineTax,
      });
    }

    // Grand total computed from summed float values
    const grandTotal = subtotal - totalDiscount + totalTax + shippingTotal;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(totalDiscount * 100) / 100,
      taxTotal: Math.round(totalTax * 100) / 100,
      shippingTotal: Math.round(shippingTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      items: calculatedItems,
    };
  }
}
