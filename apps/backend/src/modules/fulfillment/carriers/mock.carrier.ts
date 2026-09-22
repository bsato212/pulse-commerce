import { Injectable, Logger } from '@nestjs/common';
import {
  CarrierAdapter,
  RateQuoteRequest,
  RateQuoteResponse,
  ShipmentBookingRequest,
  ShipmentBookingResponse,
} from './carrier.interface';

@Injectable()
export class MockInternalCarrier implements CarrierAdapter {
  private readonly logger = new Logger(MockInternalCarrier.name);
  readonly carrierCode = 'INTERNAL_FLEET';

  async quoteRate(_request: RateQuoteRequest): Promise<RateQuoteResponse> {
    return {
      carrier: this.carrierCode,
      serviceLevel: 'STANDARD_GROUND',
      rate: 15.0,
      estimatedDeliveryDays: 3,
    };
  }

  async bookShipment(request: ShipmentBookingRequest): Promise<ShipmentBookingResponse> {
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    const trackingNumber = `PLS-INT-${randomSuffix}`;

    this.logger.log(`Generated manifest for order ${request.orderId} via ${this.carrierCode}: ${trackingNumber}`);

    return {
      trackingNumber,
      carrier: this.carrierCode,
      labelUrl: `https://labels.pulsecommerce.internal/manifests/${trackingNumber}.pdf`,
      manifestId: `MNF-${Date.now()}`,
    };
  }

  verifyWebhookSignature(_signature: string, _payload: any): boolean {
    return true;
  }
}
