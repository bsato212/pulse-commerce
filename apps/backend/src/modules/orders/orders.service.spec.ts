import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { Order, OrderItem, Product, OutboxEvent } from '../../database/entities';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@pulsecommerce/shared-types';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderQueryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const mockOrderRepo = {
    createQueryBuilder: jest.fn(() => mockOrderQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrderItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProductRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOutboxRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPricing = {
    calculateOrderTotals: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(OutboxEvent), useValue: mockOutboxRepo },
        { provide: PricingService, useValue: mockPricing },
        { provide: DataSource, useValue: mockDataSource },
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
      mockOrderQueryBuilder.getOne.mockResolvedValue({
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
      mockOrderQueryBuilder.getOne.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-101',
        status: OrderStatus.CONFIRMED,
        fulfillmentStatus: 'UNFULFILLED',
      });

      mockOrderRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const updated = await service.transitionStatus('ord-1', 'tenant-1', {
        status: OrderStatus.ALLOCATING,
      });

      expect(updated.status).toBe(OrderStatus.ALLOCATING);
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });
  });
});
