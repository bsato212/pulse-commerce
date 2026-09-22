import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mockPrisma = {
    warehouseStock: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    warehouse: {
      findMany: jest.fn(),
    },
    stockReservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reserveStock', () => {
    it('should throw NotFoundException if stock record is missing', async () => {
      mockPrisma.warehouseStock.findUnique.mockResolvedValue(null);

      await expect(
        service.reserveStock({
          productId: 'prod-unknown',
          warehouseId: 'wh-1',
          quantity: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if available stock is insufficient', async () => {
      mockPrisma.warehouseStock.findUnique.mockResolvedValue({
        id: 'ws-1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 10,
        reservedQuantity: 8, // available = 2
      });

      await expect(
        service.reserveStock({
          productId: 'prod-1',
          warehouseId: 'wh-1',
          quantity: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reserve stock and return reservation ID', async () => {
      mockPrisma.warehouseStock.findUnique.mockResolvedValue({
        id: 'ws-1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 50,
        reservedQuantity: 5,
      });

      mockPrisma.warehouseStock.update.mockResolvedValue({
        id: 'ws-1',
        quantity: 50,
        reservedQuantity: 15,
      });

      mockPrisma.stockReservation.create.mockResolvedValue({
        id: 'res-999',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 10,
        status: 'RESERVED',
        expiresAt: new Date(),
      });

      const result = await service.reserveStock({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 10,
      });

      expect(result.reservationId).toBe('res-999');
      expect(result.quantity).toBe(10);
      expect(mockPrisma.warehouseStock.update).toHaveBeenCalled();
      expect(mockPrisma.stockReservation.create).toHaveBeenCalled();
    });
  });
});
