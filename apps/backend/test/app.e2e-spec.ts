import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('PulseCommerce API (e2e)', () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    product: {
      findMany: jest.fn().mockResolvedValue([
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
      ]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue({
        id: 'prod-1',
        name: 'Pulse ANC Pro Wireless Headphones',
        price: 299.99,
      }),
      update: jest.fn().mockResolvedValue({
        id: 'prod-1',
        price: 319.99,
      }),
    },
    warehouseStock: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    warehouse: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({
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
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
