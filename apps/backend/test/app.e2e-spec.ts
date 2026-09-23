import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken, getConnectionToken, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from '../src/app.module';
import { Product, Order, WarehouseStock, Shipment } from '../src/database/entities';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValkeyService } from '../src/cache/valkey.service';
import { OrderStatus } from '@pulsecommerce/shared-types';

describe('PulseCommerce API (e2e)', () => {
  let app: INestApplication;

  const VALID_ORDER_ID = 'd0000000-0000-4000-8000-000000000001';
  const VALID_PRODUCT_ID = 'c0000000-0000-4000-8000-000000000001';
  const VALID_WAREHOUSE_ID = 'b0000000-0000-4000-8000-000000000001';

  const createMockQueryBuilder = (items: any[] = []) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(items[0] || null),
    getMany: jest.fn().mockResolvedValue(items),
    getManyAndCount: jest.fn().mockResolvedValue([items, items.length]),
  });

  const mockProductData = {
    id: VALID_PRODUCT_ID,
    sku: 'AUDIO-ANC-PRO',
    name: 'Pulse ANC Pro Wireless Headphones',
    description: 'Studio headphones',
    price: 299.99,
    costPrice: 120.0,
    categoryId: 'c0000000-0000-4000-8000-000000000099',
    category: { name: 'Electronics & Audio' },
    active: true,
    warehouseStock: [{ quantity: 100, reservedQuantity: 10 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductRepo = {
    metadata: { columns: [], relations: [] },
    createQueryBuilder: jest.fn(() => createMockQueryBuilder([mockProductData])),
    findOne: jest.fn().mockResolvedValue(mockProductData),
    find: jest.fn().mockResolvedValue([mockProductData]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockOrderData = {
    id: VALID_ORDER_ID,
    orderNumber: 'ORD-2026-1001',
    customerEmail: 'jane.smith@example.com',
    status: OrderStatus.PENDING,
    subtotal: 299.99,
    discountTotal: 0,
    taxTotal: 25.49,
    shippingTotal: 15.0,
    grandTotal: 340.48,
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: { name: 'Acme Retail Corp' },
    customer: { name: 'Jane Smith', email: 'jane.smith@example.com' },
    items: [],
  };

  const mockOrderRepo = {
    metadata: { columns: [], relations: [] },
    createQueryBuilder: jest.fn(() => createMockQueryBuilder([mockOrderData])),
    findOne: jest.fn().mockResolvedValue(mockOrderData),
    find: jest.fn().mockResolvedValue([mockOrderData]),
    create: jest.fn((e) => e),
    save: jest.fn((e) => Promise.resolve({ ...mockOrderData, ...e })),
  };

  const mockStockItem = {
    id: 's0000000-0000-4000-8000-000000000001',
    warehouseId: VALID_WAREHOUSE_ID,
    productId: VALID_PRODUCT_ID,
    quantity: 150,
    reservedQuantity: 20,
    warehouse: { id: VALID_WAREHOUSE_ID, name: 'West Coast Logistics Hub', code: 'WH-WEST' },
    product: {
      id: VALID_PRODUCT_ID,
      name: 'Pulse ANC Pro Wireless Headphones',
      sku: 'AUDIO-ANC-PRO',
    },
  };

  const mockStockRepo = {
    metadata: { columns: [], relations: [] },
    createQueryBuilder: jest.fn(() => createMockQueryBuilder([mockStockItem])),
    findOne: jest.fn().mockResolvedValue(mockStockItem),
    find: jest.fn().mockResolvedValue([mockStockItem]),
    create: jest.fn((e) => e),
    save: jest.fn((e) => Promise.resolve(e)),
  };

  const mockShipmentData = {
    id: 'e0000000-0000-4000-8000-000000000001',
    orderId: VALID_ORDER_ID,
    warehouseId: VALID_WAREHOUSE_ID,
    carrier: 'INTERNAL_FLEET',
    trackingNumber: 'TRK-2026-0001',
    status: 'IN_TRANSIT',
    createdAt: new Date(),
    order: mockOrderData,
    warehouse: mockStockItem.warehouse,
  };

  const mockShipmentRepo = {
    metadata: { columns: [], relations: [] },
    createQueryBuilder: jest.fn(() => createMockQueryBuilder([mockShipmentData])),
    findOne: jest.fn().mockResolvedValue(mockShipmentData),
    find: jest.fn().mockResolvedValue([mockShipmentData]),
    create: jest.fn((e) => e),
    save: jest.fn((e) => Promise.resolve(e)),
  };

  const genericMockRepo = {
    metadata: { columns: [], relations: [] },
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder([])),
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
        findOne: jest.fn().mockResolvedValue(mockStockItem),
      }),
    ),
    getRepository: jest.fn((entity: any) => {
      if (entity === Product || entity?.name === 'Product') return mockProductRepo;
      if (entity === Order || entity?.name === 'Order') return mockOrderRepo;
      if (entity === WarehouseStock || entity?.name === 'WarehouseStock') return mockStockRepo;
      if (entity === Shipment || entity?.name === 'Shipment') return mockShipmentRepo;
      return genericMockRepo;
    }),
  };

  const mockValkeyService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    remember: jest.fn((_key, _ttl, fn) => fn()),
    flushAll: jest.fn().mockResolvedValue(undefined),
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
      .overrideProvider(getRepositoryToken(WarehouseStock))
      .useValue(mockStockRepo)
      .overrideProvider(getRepositoryToken(Shipment))
      .useValue(mockShipmentRepo)
      .overrideProvider(ValkeyService)
      .useValue(mockValkeyService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Products Endpoints', () => {
    it('/api/v1/products (GET) - lists products with tenant header', () => {
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

    it('/api/v1/products/:id (GET) - rejects non-UUID product id with 400', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/prod-123')
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });
  });

  describe('Orders Endpoints', () => {
    it('/api/v1/orders (GET) - lists orders for tenant', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('x-tenant-id', 'acme-corp')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/api/v1/orders/:id (GET) - retrieves order with valid UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/orders/${VALID_ORDER_ID}`)
        .set('x-tenant-id', 'acme-corp')
        .expect(200)
        .expect((res) => {
          expect(res.body.orderNumber).toBe('ORD-2026-1001');
        });
    });

    it('/api/v1/orders/:id (GET) - rejects non-UUID with 400', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders/ord-seed-1')
        .set('x-tenant-id', 'acme-corp')
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });

    it('/api/v1/orders/:id/status (POST) - rejects non-UUID id with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders/ord-seed-1/status')
        .send({ status: OrderStatus.CONFIRMED })
        .expect(400);
    });

    it('/api/v1/orders/:id/status (POST) - transitions status with valid UUID', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/orders/${VALID_ORDER_ID}/status`)
        .set('x-tenant-id', 'acme-corp')
        .send({ status: OrderStatus.CONFIRMED })
        .expect(201);
    });

    it('/api/v1/orders/:id/invoice (GET) - returns invoice with valid UUID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/orders/${VALID_ORDER_ID}/invoice`)
        .expect(200)
        .expect((res) => {
          expect(res.body.invoiceNumber).toBe('INV-ORD-2026-1001');
          expect(res.body.customer.email).toBe('jane.smith@example.com');
        });
    });

    it('/api/v1/orders/:id/invoice (GET) - rejects non-UUID id with 400', () => {
      return request(app.getHttpServer()).get('/api/v1/orders/not-a-uuid/invoice').expect(400);
    });
  });

  describe('Inventory Endpoints & Contract Validation', () => {
    it('/api/v1/inventory/stocks (GET) - returns stock records for tenant', () => {
      return request(app.getHttpServer())
        .get('/api/v1/inventory/stocks')
        .set('x-tenant-id', 'acme-corp')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/api/v1/inventory/adjust (POST) - rejects non-UUID warehouseId or productId with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/inventory/adjust')
        .send({
          warehouseId: 'wh-west',
          productId: 'prod-1',
          quantityDelta: 10,
          reason: 'RECEIVING',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });

    it('/api/v1/inventory/adjust (POST) - accepts valid UUID payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/inventory/adjust')
        .send({
          warehouseId: VALID_WAREHOUSE_ID,
          productId: VALID_PRODUCT_ID,
          quantityDelta: 15,
          reason: 'RECEIVING',
        })
        .expect(201);
    });

    it('/api/v1/inventory/reserve (POST) - rejects non-UUID payload with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/inventory/reserve')
        .send({
          warehouseId: 'not-a-uuid',
          productId: 'not-a-uuid',
          quantity: 5,
        })
        .expect(400);
    });
  });

  describe('Fulfillment Endpoints', () => {
    it('/api/v1/fulfillment/shipments (GET) - lists shipments for tenant', () => {
      return request(app.getHttpServer())
        .get('/api/v1/fulfillment/shipments')
        .set('x-tenant-id', 'acme-corp')
        .expect(200);
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
