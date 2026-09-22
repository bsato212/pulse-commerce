import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { PricingService } from './pricing.service';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPricing = {
    calculateOrderTotals: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PricingService, useValue: mockPricing },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transitionStatus', () => {
    it('should disallow invalid order state transition', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-101',
        status: OrderStatus.DELIVERED,
      });

      await expect(
        service.transitionStatus('ord-1', 'tenant-1', {
          status: OrderStatus.ALLOCATING,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition from CONFIRMED to ALLOCATING', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-101',
        status: OrderStatus.CONFIRMED,
        fulfillmentStatus: 'UNFULFILLED',
      });

      mockPrisma.order.update.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-101',
        status: OrderStatus.ALLOCATING,
        fulfillmentStatus: 'UNFULFILLED',
      });

      const updated = await service.transitionStatus('ord-1', 'tenant-1', {
        status: OrderStatus.ALLOCATING,
      });

      expect(updated.status).toBe(OrderStatus.ALLOCATING);
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });
  });
});
