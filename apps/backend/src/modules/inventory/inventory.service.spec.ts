import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';
import { WarehouseStock, Warehouse, StockReservation } from '../../database/entities';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockStockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockWarehouseRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReservationRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(WarehouseStock), useValue: mockStockRepo },
        { provide: getRepositoryToken(Warehouse), useValue: mockWarehouseRepo },
        { provide: getRepositoryToken(StockReservation), useValue: mockReservationRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reserveStock', () => {
    it('should throw NotFoundException if stock record is missing', async () => {
      mockStockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.reserveStock({
          productId: 'prod-unknown',
          warehouseId: 'wh-1',
          quantity: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if available stock is insufficient', async () => {
      mockStockRepo.findOne.mockResolvedValue({
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
      mockStockRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 50,
        reservedQuantity: 5,
      });

      mockStockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      mockReservationRepo.create.mockReturnValue({
        id: 'res-999',
        warehouseStockId: 'ws-1',
        quantity: 10,
        status: 'RESERVED',
        expiresAt: new Date(),
      });

      mockReservationRepo.save.mockResolvedValue({
        id: 'res-999',
        warehouseStockId: 'ws-1',
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
      expect(mockStockRepo.save).toHaveBeenCalled();
      expect(mockReservationRepo.save).toHaveBeenCalled();
    });
  });
});
