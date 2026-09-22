import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CarrierRegistryService } from './carriers/carrier-registry.service';
import { OrderStatus, FulfillmentStatus } from '@prisma/client';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly carrierRegistry: CarrierRegistryService,
  ) {}

  async createShipment(orderId: string, warehouseId: string, carrierCode: string = 'INTERNAL_FLEET') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.ALLOCATING) {
      throw new BadRequestException(`Order ${orderId} cannot be fulfilled in status ${order.status}`);
    }

    const warehouse = await this.prisma.warehouse.findUnique({
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

    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderId: order.id,
          warehouseId,
          carrier: carrier.carrierCode,
          trackingNumber: booking.trackingNumber,
          labelUrl: booking.labelUrl,
          status: 'SHIPPED',
          shippedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.SHIPPED,
          fulfillmentStatus: FulfillmentStatus.FULFILLED,
        },
      });

      await tx.outboxEvent.create({
        data: {
          eventType: 'order.shipped',
          aggregateId: order.id,
          payload: {
            orderId: order.id,
            shipmentId: created.id,
            trackingNumber: booking.trackingNumber,
            carrier: carrier.carrierCode,
          },
        },
      });

      return created;
    });

    this.logger.log(`Created shipment ${shipment.id} for order ${order.orderNumber} via ${carrierCode}`);
    return shipment;
  }

  async getShipments(tenantId: string) {
    return this.prisma.shipment.findMany({
      where: {
        order: { tenantId },
      },
      include: {
        order: {
          select: { orderNumber: true, customerEmail: true },
        },
        warehouse: {
          select: { code: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
