import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly calculate subtotal and flat rate shipping for standard items', () => {
    const items = [
      { productId: 'prod-1', unitPrice: 100, quantity: 2 },
      { productId: 'prod-2', unitPrice: 50, quantity: 1 },
    ];

    const result = service.calculateOrderTotals(items, 0);

    expect(result.subtotal).toBe(250);
    expect(result.shippingTotal).toBe(15);
    expect(result.discountTotal).toBe(0);
    // 250 * 8.5% tax = 21.25
    expect(result.taxTotal).toBe(21.25);
    // 250 + 21.25 + 15 = 286.25
    expect(result.grandTotal).toBe(286.25);
    expect(result.items.length).toBe(2);
  });

  it('should apply discount percentage to line items and order totals', () => {
    const items = [
      { productId: 'prod-1', unitPrice: 200, quantity: 1 },
    ];

    const result = service.calculateOrderTotals(items, 10); // 10% off

    expect(result.subtotal).toBe(200);
    expect(result.discountTotal).toBe(20);
    // Tax on (200 - 20 = 180) * 8.5% = 15.30
    expect(result.taxTotal).toBe(15.3);
    // 180 + 15.3 + 15 shipping = 210.3
    expect(result.grandTotal).toBe(210.3);
  });
});
