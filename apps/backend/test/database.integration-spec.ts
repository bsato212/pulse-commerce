import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { DataSource, QueryFailedError } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ValkeyService } from '../src/cache/valkey.service';
import {
  Tenant,
  User,
  Category,
  Product,
  Warehouse,
  WarehouseStock,
  StockReservation,
  Order,
  OrderItem,
  Shipment,
  OutboxEvent,
  WebhookSubscription,
} from '../src/database/entities';
import { InitialMigration1710000000000 } from '../src/database/migrations/1710000000000-InitialMigration';
import {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  UserRole,
} from '@pulsecommerce/shared-types';

describe('PulseCommerce Infrastructure Integration (PostgreSQL 18 & Valkey 9.0)', () => {
  let pgContainer: StartedPostgreSqlContainer;
  let valkeyContainer: StartedTestContainer;
  let dataSource: DataSource;
  let valkeyService: ValkeyService;

  beforeAll(async () => {
    // 1. Spin up ephemeral PostgreSQL 18 container
    pgContainer = await new PostgreSqlContainer('postgres:18-alpine').start();

    // 2. Spin up ephemeral Valkey 9.0 container
    valkeyContainer = await new GenericContainer('valkey/valkey:9.0-alpine')
      .withExposedPorts(6379)
      .start();

    // 3. Initialize real TypeORM DataSource with live migration
    dataSource = new DataSource({
      type: 'postgres',
      url: pgContainer.getConnectionUri(),
      entities: [
        Tenant,
        User,
        Category,
        Product,
        Warehouse,
        WarehouseStock,
        StockReservation,
        Order,
        OrderItem,
        Shipment,
        OutboxEvent,
        WebhookSubscription,
      ],
      migrations: [InitialMigration1710000000000],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
    await dataSource.runMigrations();

    // 4. Initialize real Valkey cache service connecting to Valkey container
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'VALKEY_HOST') return valkeyContainer.getHost();
        if (key === 'VALKEY_PORT') return valkeyContainer.getMappedPort(6379);
        if (key === 'VALKEY_PASSWORD') return undefined;
        return defaultValue;
      }),
    } as unknown as ConfigService;

    valkeyService = new ValkeyService(mockConfigService);
    valkeyService.onModuleInit();

    // Wait briefly for Redis connection handshake
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, 90000);

  afterAll(async () => {
    if (valkeyService) {
      await valkeyService.onModuleDestroy();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (valkeyContainer) {
      await valkeyContainer.stop();
    }
    if (pgContainer) {
      await pgContainer.stop();
    }
  });

  describe('PostgreSQL Schema & Migrations', () => {
    it('successfully applies migrations and sets up all relational tables', async () => {
      const queryRunner = dataSource.createQueryRunner();
      const tables = await queryRunner.getTables([
        'tenants',
        'users',
        'categories',
        'products',
        'warehouses',
        'warehouse_stocks',
        'orders',
        'order_items',
        'outbox_events',
      ]);
      await queryRunner.release();

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('tenants');
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('warehouses');
      expect(tableNames).toContain('orders');
    });
  });

  describe('Strict Multi-Tenant Isolation', () => {
    it('isolates data between distinct tenants', async () => {
      const tenantRepo = dataSource.getRepository(Tenant);
      const warehouseRepo = dataSource.getRepository(Warehouse);

      const tenantA = await tenantRepo.save(
        tenantRepo.create({
          slug: 'alpha-corp',
          name: 'Alpha Corporation',
          plan: 'ENTERPRISE',
        }),
      );

      const tenantB = await tenantRepo.save(
        tenantRepo.create({
          slug: 'beta-corp',
          name: 'Beta Corporation',
          plan: 'ENTERPRISE',
        }),
      );

      await warehouseRepo.save(
        warehouseRepo.create({
          tenantId: tenantA.id,
          code: 'WH-ALPHA-01',
          name: 'Alpha Logistics Center',
          street: '100 Alpha Way',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'USA',
        }),
      );

      const alphaWarehouses = await warehouseRepo.find({ where: { tenantId: tenantA.id } });
      const betaWarehouses = await warehouseRepo.find({ where: { tenantId: tenantB.id } });

      expect(alphaWarehouses).toHaveLength(1);
      expect(alphaWarehouses[0].code).toBe('WH-ALPHA-01');
      expect(betaWarehouses).toHaveLength(0);
    });
  });

  describe('UUID Integrity & Constraint Enforcement', () => {
    it('rejects foreign key violation when tenantId does not exist', async () => {
      const warehouseRepo = dataSource.getRepository(Warehouse);
      const nonExistentTenantId = '00000000-0000-4000-8000-000000000099';

      const invalidWarehouse = warehouseRepo.create({
        tenantId: nonExistentTenantId,
        code: 'WH-INVALID-01',
        name: 'Invalid Warehouse',
        street: '123 Ghost St',
        city: 'Nowhere',
        state: 'NA',
        postalCode: '00000',
        country: 'USA',
      });

      await expect(warehouseRepo.save(invalidWarehouse)).rejects.toThrow(QueryFailedError);
    });

    it('triggers PostgreSQL 22P02 error when querying with non-UUID syntax directly', async () => {
      await expect(
        dataSource.query(`SELECT * FROM "orders" WHERE "id" = 'ord-seed-invalid'`),
      ).rejects.toThrow();
    });
  });

  describe('Transactional Atomicity', () => {
    it('atomically commits order creation and outbox event within a transaction', async () => {
      const tenantRepo = dataSource.getRepository(Tenant);
      const userRepo = dataSource.getRepository(User);
      const orderRepo = dataSource.getRepository(Order);
      const outboxRepo = dataSource.getRepository(OutboxEvent);

      const tenant = await tenantRepo.save(
        tenantRepo.create({
          slug: 'gamma-corp',
          name: 'Gamma Corporation',
          plan: 'ENTERPRISE',
        }),
      );

      const user = await userRepo.save(
        userRepo.create({
          tenantId: tenant.id,
          email: 'gamma-admin@example.com',
          name: 'Gamma Admin',
          role: UserRole.CUSTOMER,
          passwordHash: 'hash',
        }),
      );

      const orderNumber = 'ORD-TX-TEST-001';

      await dataSource.transaction(async (manager) => {
        const order = manager.create(Order, {
          tenantId: tenant.id,
          customerId: user.id,
          orderNumber,
          customerEmail: user.email,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          subtotal: 100.0,
          discountTotal: 0,
          taxTotal: 10.0,
          shippingTotal: 5.0,
          grandTotal: 115.0,
          currency: 'USD',
          shippingAddress: {
            street: '1 Gamma St',
            city: 'Portland',
            state: 'OR',
            postalCode: '97201',
            country: 'USA',
          },
        });
        const savedOrder = await manager.save(Order, order);

        const outbox = manager.create(OutboxEvent, {
          eventType: 'order.created',
          aggregateId: savedOrder.id,
          payload: { orderId: savedOrder.id, orderNumber: savedOrder.orderNumber },
        });
        await manager.save(OutboxEvent, outbox);
      });

      const order = await orderRepo.findOne({ where: { orderNumber } });
      expect(order).toBeDefined();
      expect(Number(order?.grandTotal)).toBe(115.0);

      const outbox = await outboxRepo.findOne({ where: { aggregateId: order?.id } });
      expect(outbox).toBeDefined();
      expect(outbox?.eventType).toBe('order.created');
    });

    it('rolls back all mutations if an error occurs within transaction block', async () => {
      const tenantRepo = dataSource.getRepository(Tenant);
      const userRepo = dataSource.getRepository(User);
      const orderRepo = dataSource.getRepository(Order);

      const tenant = await tenantRepo.findOneOrFail({ where: { slug: 'gamma-corp' } });
      const user = await userRepo.findOneOrFail({ where: { email: 'gamma-admin@example.com' } });
      const failOrderNumber = 'ORD-FAIL-TX-001';

      try {
        await dataSource.transaction(async (manager) => {
          const order = manager.create(Order, {
            tenantId: tenant.id,
            customerId: user.id,
            orderNumber: failOrderNumber,
            customerEmail: 'rollback@example.com',
            status: OrderStatus.PENDING,
            subtotal: 50.0,
            grandTotal: 50.0,
            currency: 'USD',
            shippingAddress: {
              street: '1 Fail St',
              city: 'None',
              state: 'NA',
              postalCode: '00000',
              country: 'USA',
            },
          });
          await manager.save(Order, order);

          // Force failure
          throw new Error('Simulated transactional failure');
        });
      } catch (err: any) {
        expect(err.message).toBe('Simulated transactional failure');
      }

      const rolledBackOrder = await orderRepo.findOne({ where: { orderNumber: failOrderNumber } });
      expect(rolledBackOrder).toBeNull();
    });
  });

  describe('Live Valkey 9.0 Cache Integration', () => {
    it('sets, gets, and deletes values in live Valkey engine', async () => {
      const cacheKey = 'catalog:test:product:101';
      const payload = { id: '101', name: 'Studio Monitor Speakers', price: 499.99 };

      await valkeyService.set(cacheKey, payload, 60);

      const cached = await valkeyService.get<{ id: string; name: string; price: number }>(cacheKey);
      expect(cached).toBeDefined();
      expect(cached?.name).toBe('Studio Monitor Speakers');
      expect(cached?.price).toBe(499.99);

      await valkeyService.del(cacheKey);

      const afterDelete = await valkeyService.get(cacheKey);
      expect(afterDelete).toBeNull();
    });

    it('executes remember pattern against live Valkey caching engine', async () => {
      const cacheKey = 'catalog:remember:test';
      let fetchCount = 0;

      const fetchFn = async () => {
        fetchCount++;
        return { message: 'fresh database record', count: fetchCount };
      };

      // First call invokes fetchFn
      const res1 = await valkeyService.remember(cacheKey, 60, fetchFn);
      expect(res1.message).toBe('fresh database record');
      expect(fetchCount).toBe(1);

      // Second call reads directly from Valkey without invoking fetchFn
      const res2 = await valkeyService.remember(cacheKey, 60, fetchFn);
      expect(res2.message).toBe('fresh database record');
      expect(fetchCount).toBe(1);

      // Flush and confirm re-fetch
      await valkeyService.flushAll();
      const res3 = await valkeyService.remember(cacheKey, 60, fetchFn);
      expect(fetchCount).toBe(2);
      expect(res3.count).toBe(2);
    });
  });
});
