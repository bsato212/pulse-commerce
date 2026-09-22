import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CarrierAdapter } from './carrier.interface';
import { MockInternalCarrier } from './mock.carrier';

@Injectable()
export class CarrierRegistryService {
  private readonly logger = new Logger(CarrierRegistryService.name);
  private readonly registry = new Map<string, CarrierAdapter>();

  constructor(private readonly defaultCarrier: MockInternalCarrier) {
    this.register(defaultCarrier);
  }

  register(adapter: CarrierAdapter) {
    this.registry.set(adapter.carrierCode, adapter);
    this.logger.log(`Registered carrier adapter: ${adapter.carrierCode}`);
  }

  getCarrier(carrierCode: string = 'INTERNAL_FLEET'): CarrierAdapter {
    const adapter = this.registry.get(carrierCode);
    if (!adapter) {
      throw new NotFoundException(`Carrier adapter for '${carrierCode}' is not registered`);
    }
    return adapter;
  }

  listAvailableCarriers(): string[] {
    return Array.from(this.registry.keys());
  }
}
