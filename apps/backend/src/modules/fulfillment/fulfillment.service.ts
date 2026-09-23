import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Shipment, Order, Warehouse, OutboxEvent } from '../../database/entities';
import { CarrierRegistryService } from './carriers/carrier-registry.service';
import { OrderStatus, FulfillmentStatus } from '@pulsecommerce/shared-types';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly carrierRegistry: CarrierRegistryService,
    private readonly dataSource: DataSource,
  ) {}

  async createShipment(
    orderId: string,
    warehouseId: string,
    carrierCode: string = 'INTERNAL_FLEET',
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'customer'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.ALLOCATING) {
      throw new BadRequestException(
        `Order ${orderId} cannot be fulfilled in status ${order.status}`,
      );
    }

    const warehouse = await this.warehouseRepo.findOne({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${warehouseId} not found`);
    }

    const carrier = this.carrierRegistry.getCarrier(carrierCode);
    const shippingAddress = order.shippingAddress as any;

    const booking = await carrier.bookShipment({
      orderId: order.id,
      recipientName: order.customer.name,
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      items: order.items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
    });

    const shipment = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(Shipment, {
        orderId: order.id,
        warehouseId,
        carrier: carrier.carrierCode,
        trackingNumber: booking.trackingNumber,
        labelUrl: booking.labelUrl,
        status: 'SHIPPED',
        shippedAt: new Date(),
      });
      const savedShipment = await manager.save(Shipment, created);

      order.status = OrderStatus.SHIPPED;
      order.fulfillmentStatus = FulfillmentStatus.FULFILLED;
      await manager.save(Order, order);

      const outbox = manager.create(OutboxEvent, {
        eventType: 'order.shipped',
        aggregateId: order.id,
        payload: {
          orderId: order.id,
          shipmentId: savedShipment.id,
          trackingNumber: booking.trackingNumber,
          carrier: carrier.carrierCode,
        },
      });
      await manager.save(OutboxEvent, outbox);

      return savedShipment;
    });

    this.logger.log(
      `Created shipment ${shipment.id} for order ${order.orderNumber} via ${carrierCode}`,
    );
    return shipment;
  }

  async getShipments(tenantId: string) {
    return this.shipmentRepo
      .createQueryBuilder('shipment')
      .innerJoinAndSelect('shipment.order', 'order')
      .innerJoinAndSelect('shipment.warehouse', 'warehouse')
      .where('order.tenantId = :tenantId', { tenantId })
      .orderBy('shipment.createdAt', 'DESC')
      .getMany();
  }
}
