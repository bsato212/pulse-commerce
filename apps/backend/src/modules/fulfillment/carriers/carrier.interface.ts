export interface RateQuoteRequest {
  originPostalCode: string;
  originCountry: string;
  destinationPostalCode: string;
  destinationCountry: string;
  weightGrams: number;
}

export interface RateQuoteResponse {
  carrier: string;
  serviceLevel: string;
  rate: number;
  estimatedDeliveryDays: number;
}

export interface ShipmentBookingRequest {
  orderId: string;
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  items: Array<{ sku: string; quantity: number }>;
}

export interface ShipmentBookingResponse {
  trackingNumber: string;
  carrier: string;
  labelUrl: string;
  manifestId: string;
}

export interface CarrierAdapter {
  readonly carrierCode: string;
  quoteRate(request: RateQuoteRequest): Promise<RateQuoteResponse>;
  bookShipment(request: ShipmentBookingRequest): Promise<ShipmentBookingResponse>;
  verifyWebhookSignature(signature: string, payload: any): boolean;
}
