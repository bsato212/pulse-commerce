import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken, getConnectionToken, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Product, Order } from '../src/database/entities';

describe('PulseCommerce API (e2e)', () => {
  let app: INestApplication;

  const mockProductQueryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([
      [
        {
          id: 'prod-1',
          sku: 'AUDIO-ANC-PRO',
          name: 'Pulse ANC Pro Wireless Headphones',
          description: 'Studio headphones',
          price: 299.99,
          costPrice: 120.0,
          categoryId: 'cat-1',
          category: { name: 'Electronics & Audio' },
          active: true,
          warehouseStock: [{ quantity: 100, reservedQuantity: 10 }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      1,
    ]),
  };

  const mockProductRepo = {
    metadata: { columns: [], relations: [] },
    createQueryBuilder: jest.fn(() => mockProductQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
  };

  const mockOrderRepo = {
    metadata: { columns: [], relations: [] },
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    findOne: jest.fn().mockResolvedValue({
      id: 'ord-101',
      orderNumber: 'ORD-2026-1001',
      customerEmail: 'jane.smith@example.com',
      subtotal: 299.99,
      discountTotal: 0,
      taxTotal: 25.49,
      shippingTotal: 15.0,
      grandTotal: 340.48,
      currency: 'USD',
      createdAt: new Date(),
      tenant: { name: 'Acme Retail Corp' },
      customer: { name: 'Jane Smith', email: 'jane.smith@example.com' },
      items: [],
    }),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((e) => e),
    save: jest.fn((e) => Promise.resolve(e)),
  };

  const genericMockRepo = {
    metadata: { columns: [], relations: [] },
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    createQueryBuilder: jest.fn(() => mockProductQueryBuilder),
    create: jest.fn((e) => e),
    save: jest.fn((e) => Promise.resolve(e)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockDataSource = {
    isInitialized: true,
    options: { type: 'postgres' },
    entityMetadatas: [],
    initialize: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
    transaction: jest.fn((cb) =>
      cb({
        create: jest.fn((_, e) => e),
        save: jest.fn((_, e) => Promise.resolve(e)),
      }),
    ),
    getRepository: jest.fn((entity: any) => {
      if (entity === Product || entity?.name === 'Product') {
        return mockProductRepo;
      }
      if (entity === Order || entity?.name === 'Order') {
        return mockOrderRepo;
      }
      return genericMockRepo;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .overrideProvider(getDataSourceToken())
      .useValue(mockDataSource)
      .overrideProvider(getConnectionToken())
      .useValue(mockDataSource)
      .overrideProvider(getRepositoryToken(Product))
      .useValue(mockProductRepo)
      .overrideProvider(getRepositoryToken(Order))
      .useValue(mockOrderRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/v1/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/products')
      .set('x-tenant-id', 'acme-corp')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].sku).toBe('AUDIO-ANC-PRO');
      });
  });

  it('/api/v1/orders/:id/invoice (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/orders/ord-101/invoice')
      .expect(200)
      .expect((res) => {
        expect(res.body.invoiceNumber).toBe('INV-ORD-2026-1001');
        expect(res.body.customer.email).toBe('jane.smith@example.com');
      });
  });
});
