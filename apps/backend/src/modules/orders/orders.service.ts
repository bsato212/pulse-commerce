import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PricingService } from './pricing.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.ALLOCATING, OrderStatus.CANCELLED],
  [OrderStatus.ALLOCATING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async listOrders(tenantId: string, status?: OrderStatus) {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: true,
        shipments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
        shipments: true,
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} was not found`);
    }

    return order;
  }

  async createOrder(tenantId: string, customerId: string, dto: CreateOrderDto) {
    // 1. Fetch products
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more selected products are invalid or inactive');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Prepare calculation input
    const calculationItems = dto.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      return {
        productId: prod.id,
        unitPrice: prod.price,
        quantity: item.quantity,
      };
    });

    // 3. Calculate totals (using pricing service)
    const discountPercent = dto.discountCode === 'PULSE10' ? 10 : 0;
    const pricing = this.pricingService.calculateOrderTotals(calculationItems, discountPercent);

    // 4. Generate order number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${datePrefix}-${randomSuffix}`;

    // 5. Persist order with line items in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          customerId,
          customerEmail: dto.customerEmail,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.AUTHORIZED,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          shippingAddress: dto.shippingAddress as any,
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          taxTotal: pricing.taxTotal,
          shippingTotal: pricing.shippingTotal,
          grandTotal: pricing.grandTotal,
          currency: 'USD',
          items: {
            create: pricing.items.map((line) => {
              const p = productMap.get(line.productId)!;
              return {
                productId: line.productId,
                sku: p.sku,
                productName: p.name,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
                discountAmount: line.discountAmount,
                taxAmount: line.taxAmount,
                subtotal: line.subtotal,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Write outbox event for fulfillment notification
      await tx.outboxEvent.create({
        data: {
          eventType: 'order.created',
          aggregateId: newOrder.id,
          payload: {
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            grandTotal: newOrder.grandTotal,
            items: newOrder.items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
          },
        },
      });

      return newOrder;
    });

    this.logger.log(`Created order ${order.orderNumber} ($${order.grandTotal})`);
    return order;
  }

  async transitionStatus(orderId: string, tenantId: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrderById(orderId, tenantId);

    const allowedNext = ALLOWED_TRANSITIONS[order.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${dto.status}. Allowed: ${allowedNext.join(', ')}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        fulfillmentStatus:
          dto.status === OrderStatus.SHIPPED
            ? FulfillmentStatus.FULFILLED
            : order.fulfillmentStatus,
      },
      include: { items: true },
    });

    this.logger.log(`Order ${order.orderNumber} transitioned from ${order.status} to ${dto.status}`);
    return updated;
  }

  // Invoice generator for customer and accountant downloads
  async generateInvoicePdf(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: true,
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Generates JSON structure formatted for PDF printing/streaming
    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      date: order.createdAt.toISOString(),
      tenant: {
        name: order.tenant.name,
      },
      customer: {
        name: order.customer.name,
        email: order.customerEmail,
      },
      lineItems: order.items.map((i) => ({
        sku: i.sku,
        name: i.productName,
        price: i.unitPrice,
        quantity: i.quantity,
        total: i.subtotal,
      })),
      pricing: {
        subtotal: order.subtotal,
        discount: order.discountTotal,
        tax: order.taxTotal,
        shipping: order.shippingTotal,
        grandTotal: order.grandTotal,
        currency: order.currency,
      },
    };
  }
}
