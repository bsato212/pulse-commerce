import { AppDataSource } from '../data-source';
import {
  Tenant,
  User,
  Category,
  Product,
  Warehouse,
  WarehouseStock,
  Order,
  OrderItem,
  WebhookSubscription,
} from '../entities';
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from '@pulsecommerce/shared-types';

async function seed() {
  console.log('🌱 Starting TypeORM Database Initialization & Seeding for PulseCommerce...');

  let retries = 5;
  while (retries > 0) {
    try {
      await AppDataSource.initialize();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      console.log(`Database connection failed, retrying in 2 seconds... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  console.log('Connected to database via AppDataSource');

  console.log('Running pending migrations...');
  await AppDataSource.runMigrations();
  console.log('✓ Migrations applied successfully');

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const warehouseRepo = AppDataSource.getRepository(Warehouse);
  const stockRepo = AppDataSource.getRepository(WarehouseStock);
  const orderRepo = AppDataSource.getRepository(Order);
  const webhookRepo = AppDataSource.getRepository(WebhookSubscription);

  // 1. Tenants
  let tenantAcme = await tenantRepo.findOne({ where: { slug: 'acme-corp' } });
  if (!tenantAcme) {
    tenantAcme = tenantRepo.create({
      slug: 'acme-corp',
      name: 'Acme Retail Corp',
      plan: 'ENTERPRISE',
    });
    await tenantRepo.save(tenantAcme);
  }

  let tenantOmni = await tenantRepo.findOne({ where: { slug: 'omni-trade' } });
  if (!tenantOmni) {
    tenantOmni = tenantRepo.create({
      slug: 'omni-trade',
      name: 'OmniTrade Global',
      plan: 'ENTERPRISE',
    });
    await tenantRepo.save(tenantOmni);
  }

  console.log('✓ Tenants seeded');

  // 2. Users
  let userAdmin = await userRepo.findOne({ where: { email: 'admin@acme.com' } });
  if (!userAdmin) {
    userAdmin = userRepo.create({
      tenantId: tenantAcme.id,
      email: 'admin@acme.com',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      passwordHash: '$2b$10$epBQLZ5E86r1gWj0RzLh8.G6l7c7wRKn8/aUfC0K6x7jM0/tI6O4G',
    });
    await userRepo.save(userAdmin);
  }

  let userCustomer = await userRepo.findOne({ where: { email: 'jane.smith@example.com' } });
  if (!userCustomer) {
    userCustomer = userRepo.create({
      tenantId: tenantAcme.id,
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      role: UserRole.CUSTOMER,
      passwordHash: '$2b$10$epBQLZ5E86r1gWj0RzLh8.G6l7c7wRKn8/aUfC0K6x7jM0/tI6O4G',
    });
    await userRepo.save(userCustomer);
  }

  console.log('✓ Users seeded');

  // 3. Categories
  let catAudio = await categoryRepo.findOne({ where: { slug: 'electronics-audio' } });
  if (!catAudio) {
    catAudio = categoryRepo.create({
      name: 'Electronics & Audio',
      slug: 'electronics-audio',
      description: 'Studio monitors, headphones, and audiophile gear',
    });
    await categoryRepo.save(catAudio);
  }

  let catOffice = await categoryRepo.findOne({ where: { slug: 'office-furniture' } });
  if (!catOffice) {
    catOffice = categoryRepo.create({
      name: 'Office Equipment',
      slug: 'office-furniture',
      description: 'Ergonomic office desks, chairs, and mounts',
    });
    await categoryRepo.save(catOffice);
  }

  console.log('✓ Categories seeded');

  // 4. Products
  let prodHeadphones = await productRepo.findOne({ where: { sku: 'AUDIO-ANC-PRO' } });
  if (!prodHeadphones) {
    prodHeadphones = productRepo.create({
      sku: 'AUDIO-ANC-PRO',
      name: 'Pulse ANC Pro Wireless Headphones',
      description: 'Studio-grade noise cancelling wireless headphones with 40h battery life',
      price: 299.99,
      costPrice: 120.0,
      categoryId: catAudio.id,
    });
    await productRepo.save(prodHeadphones);
  }

  let prodDac = await productRepo.findOne({ where: { sku: 'AUDIO-DAC-MINI' } });
  if (!prodDac) {
    prodDac = productRepo.create({
      sku: 'AUDIO-DAC-MINI',
      name: 'Pulse Mini USB-C HiFi DAC',
      description: 'Lossless 32-bit/384kHz digital audio converter with hardware MQA decoder',
      price: 89.5,
      costPrice: 32.0,
      categoryId: catAudio.id,
    });
    await productRepo.save(prodDac);
  }

  let prodChair = await productRepo.findOne({ where: { sku: 'FURN-ERGO-CHAIR' } });
  if (!prodChair) {
    prodChair = productRepo.create({
      sku: 'FURN-ERGO-CHAIR',
      name: 'ErgoPulse Mesh Desk Chair',
      description: 'High-back lumbar support ergonomic task chair with 4D armrests',
      price: 450.0,
      costPrice: 195.0,
      categoryId: catOffice.id,
    });
    await productRepo.save(prodChair);
  }

  console.log('✓ Products seeded');

  // 5. Warehouses
  let whEast = await warehouseRepo.findOne({ where: { code: 'WH-USEAST-01' } });
  if (!whEast) {
    whEast = warehouseRepo.create({
      tenantId: tenantAcme.id,
      code: 'WH-USEAST-01',
      name: 'Newark Distribution Hub',
      street: '100 Logistics Blvd',
      city: 'Newark',
      state: 'NJ',
      postalCode: '07114',
      country: 'USA',
    });
    await warehouseRepo.save(whEast);
  }

  let whWest = await warehouseRepo.findOne({ where: { code: 'WH-USWEST-01' } });
  if (!whWest) {
    whWest = warehouseRepo.create({
      tenantId: tenantAcme.id,
      code: 'WH-USWEST-01',
      name: 'Reno Fulfillment Center',
      street: '550 Desert Logistics Way',
      city: 'Reno',
      state: 'NV',
      postalCode: '89502',
      country: 'USA',
    });
    await warehouseRepo.save(whWest);
  }

  console.log('✓ Warehouses seeded');

  // 6. Stocks
  const stockSeedPairs = [
    { wh: whEast.id, prod: prodHeadphones.id, qty: 150, res: 12, reorder: 25 },
    { wh: whWest.id, prod: prodHeadphones.id, qty: 200, res: 5, reorder: 30 },
    { wh: whEast.id, prod: prodDac.id, qty: 80, res: 2, reorder: 15 },
    { wh: whWest.id, prod: prodChair.id, qty: 12, res: 4, reorder: 10 },
  ];

  for (const pair of stockSeedPairs) {
    let stock = await stockRepo.findOne({
      where: { warehouseId: pair.wh, productId: pair.prod },
    });
    if (!stock) {
      stock = stockRepo.create({
        warehouseId: pair.wh,
        productId: pair.prod,
        quantity: pair.qty,
        reservedQuantity: pair.res,
        reorderPoint: pair.reorder,
      });
      await stockRepo.save(stock);
    }
  }

  console.log('✓ Warehouse stock allocations seeded');

  // 7. Orders
  let order1 = await orderRepo.findOne({ where: { orderNumber: 'ORD-2026-1001' } });
  if (!order1) {
    order1 = orderRepo.create({
      tenantId: tenantAcme.id,
      customerId: userCustomer.id,
      orderNumber: 'ORD-2026-1001',
      customerEmail: userCustomer.email,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PARTIALLY_FULFILLED,
      subtotal: 389.49,
      discountTotal: 25.0,
      taxTotal: 29.16,
      shippingTotal: 15.0,
      grandTotal: 408.65,
      currency: 'USD',
      shippingAddress: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA',
      },
      items: [
        {
          productId: prodHeadphones.id,
          sku: prodHeadphones.sku,
          productName: prodHeadphones.name,
          unitPrice: 299.99,
          quantity: 1,
          discount: 20.0,
          subtotal: 279.99,
        } as OrderItem,
        {
          productId: prodDac.id,
          sku: prodDac.sku,
          productName: prodDac.name,
          unitPrice: 89.5,
          quantity: 1,
          discount: 5.0,
          subtotal: 84.5,
        } as OrderItem,
      ],
    });
    await orderRepo.save(order1);
  }

  // 8. Webhook Subscriptions
  let webhook1 = await webhookRepo.findOne({ where: { tenantId: tenantAcme.id } });
  if (!webhook1) {
    webhook1 = webhookRepo.create({
      tenantId: tenantAcme.id,
      url: 'https://webhook.site/eval-acme-listener',
      secret: 'whsec_enterprise_sample_secret_key_84920491',
      events: ['order.created', 'order.shipped', 'inventory.low_stock'],
      active: true,
    });
    await webhookRepo.save(webhook1);
  }

  console.log('✅ TypeORM seeding complete!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
