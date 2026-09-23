import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';
import { CarrierRegistryService } from './carriers/carrier-registry.service';
import { MockInternalCarrier } from './carriers/mock.carrier';
import { ShipBobCarrier } from './carriers/shipbob.carrier';
import { OutboxService } from './events/outbox.service';
import { Shipment, Order, Warehouse, OutboxEvent } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Order, Warehouse, OutboxEvent])],
  controllers: [FulfillmentController],
  providers: [
    FulfillmentService,
    CarrierRegistryService,
    MockInternalCarrier,
    ShipBobCarrier,
    OutboxService,
  ],
  exports: [FulfillmentService, CarrierRegistryService, OutboxService],
})
export class FulfillmentModule {}
