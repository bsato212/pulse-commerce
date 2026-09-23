import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderItem, Product, OutboxEvent } from '../../database/entities';
import { PricingService } from './pricing.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@pulsecommerce/shared-types';

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
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly pricingService: PricingService,
    private readonly dataSource: DataSource,
  ) {}

  async listOrders(tenantId: string, status?: OrderStatus) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.shipments', 'shipments')
      .where('order.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    qb.orderBy('order.createdAt', 'DESC');
    return qb.getMany();
  }

  async getOrderById(id: string, tenantId?: string) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.shipments', 'shipments')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.id = :id', { id });

    if (tenantId) {
      qb.andWhere('order.tenantId = :tenantId', { tenantId });
    }

    const order = await qb.getOne();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} was not found`);
    }

    return order;
  }

  async createOrder(tenantId: string, customerId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepo.find({
      where: {
        id: In(productIds),
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more selected products are invalid or inactive');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const calculationItems = dto.items.map((item) => {
      const prod = productMap.get(item.productId)!;
      return {
        productId: prod.id,
        unitPrice: Number(prod.price),
        quantity: item.quantity,
      };
    });

    const discountPercent = dto.discountCode === 'PULSE10' ? 10 : 0;
    const pricing = this.pricingService.calculateOrderTotals(calculationItems, discountPercent);

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${datePrefix}-${randomSuffix}`;

    const order = await this.dataSource.transaction(async (manager) => {
      const newOrder = manager.create(Order, {
        tenantId,
        orderNumber,
        customerId,
        customerEmail: dto.customerEmail,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.AUTHORIZED,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress || null,
        subtotal: pricing.subtotal,
        discountTotal: pricing.discountTotal,
        taxTotal: pricing.taxTotal,
        shippingTotal: pricing.shippingTotal,
        grandTotal: pricing.grandTotal,
        currency: 'USD',
      });

      const savedOrder = await manager.save(Order, newOrder);

      const items = pricing.items.map((line) => {
        const p = productMap.get(line.productId)!;
        return manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: line.productId,
          sku: p.sku,
          productName: p.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          discount: line.discountAmount,
          subtotal: line.subtotal,
        });
      });

      savedOrder.items = await manager.save(OrderItem, items);

      const event = manager.create(OutboxEvent, {
        eventType: 'order.created',
        aggregateId: savedOrder.id,
        payload: {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          grandTotal: savedOrder.grandTotal,
          items: savedOrder.items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
        },
      });

      await manager.save(OutboxEvent, event);
      return savedOrder;
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

    order.status = dto.status;
    if (dto.status === OrderStatus.SHIPPED) {
      order.fulfillmentStatus = FulfillmentStatus.FULFILLED;
    }

    const updated = await this.orderRepo.save(order);
    this.logger.log(
      `Order ${order.orderNumber} transitioned from ${order.status} to ${dto.status}`,
    );
    return updated;
  }

  async generateInvoicePdf(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'tenant', 'customer'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

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
        price: Number(i.unitPrice),
        quantity: i.quantity,
        total: Number(i.subtotal),
      })),
      pricing: {
        subtotal: Number(order.subtotal),
        discount: Number(order.discountTotal),
        tax: Number(order.taxTotal),
        shipping: Number(order.shippingTotal),
        grandTotal: Number(order.grandTotal),
        currency: order.currency,
      },
    };
  }
}
