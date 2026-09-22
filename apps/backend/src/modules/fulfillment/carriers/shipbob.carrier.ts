import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  CarrierAdapter,
  RateQuoteRequest,
  RateQuoteResponse,
  ShipmentBookingRequest,
  ShipmentBookingResponse,
} from './carrier.interface';

@Injectable()
export class ShipBobCarrier implements CarrierAdapter {
  readonly carrierCode = 'SHIPBOB';

  async quoteRate(_request: RateQuoteRequest): Promise<RateQuoteResponse> {
    throw new NotImplementedException('ShipBob rate quotation integration pending carrier API credentials');
  }

  async bookShipment(_request: ShipmentBookingRequest): Promise<ShipmentBookingResponse> {
    throw new NotImplementedException('ShipBob shipment booking pending implementation');
  }

  verifyWebhookSignature(_signature: string, _payload: any): boolean {
    throw new NotImplementedException('ShipBob webhook signature verification pending implementation');
  }
}
