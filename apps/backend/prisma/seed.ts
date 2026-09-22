import { PrismaClient, UserRole, OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PulseCommerce database...');

  // Clean existing data
  await prisma.outboxEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create Tenants
  const tenantAcme = await prisma.tenant.create({
    data: {
      name: 'Acme Retail Corp',
      slug: 'acme-corp',
    },
  });

  const tenantOmni = await prisma.tenant.create({
    data: {
      name: 'OmniTrade Global',
      slug: 'omni-trade',
    },
  });

  // Create Users
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenantAcme.id,
      email: 'admin@acme.com',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QL3.vM9W4j2C0VlE89E3Qo1QW', // bcrypt hash for 'AdminSecret123!'
      name: 'Sarah Connor',
      role: UserRole.ADMIN,
    },
  });

  const warehouseManager = await prisma.user.create({
    data: {
      tenantId: tenantAcme.id,
      email: 'logistics@acme.com',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QL3.vM9W4j2C0VlE89E3Qo1QW',
      name: 'Marcus Vance',
      role: UserRole.WAREHOUSE_MANAGER,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      tenantId: tenantAcme.id,
      email: 'jane.smith@example.com',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QL3.vM9W4j2C0VlE89E3Qo1QW',
      name: 'Jane Smith',
      role: UserRole.CUSTOMER,
    },
  });

  // Create Categories
  const catElectronics = await prisma.category.create({
    data: { name: 'Electronics & Audio', slug: 'electronics-audio', description: 'Headphones, amplifiers, and DACs' },
  });
  const catOffice = await prisma.category.create({
    data: { name: 'Office Equipment', slug: 'office-equipment', description: 'Ergonomic chairs and desks' },
  });

  // Create Products
  const prodHeadphones = await prisma.product.create({
    data: {
      tenantId: tenantAcme.id,
      categoryId: catElectronics.id,
      sku: 'AUDIO-ANC-PRO',
      name: 'Pulse ANC Pro Wireless Headphones',
      description: 'Studio-grade noise cancelling wireless headphones with 40h battery life',
      price: 299.99,
      costPrice: 120.00,
      active: true,
    },
  });

  const prodDac = await prisma.product.create({
    data: {
      tenantId: tenantAcme.id,
      categoryId: catElectronics.id,
      sku: 'AUDIO-DAC-MINI',
      name: 'Pulse Mini USB-C HiFi DAC',
      description: 'Lossless 32-bit/384kHz digital audio converter',
      price: 89.50,
      costPrice: 32.00,
      active: true,
    },
  });

  const prodChair = await prisma.product.create({
    data: {
      tenantId: tenantAcme.id,
      categoryId: catOffice.id,
      sku: 'FURN-ERGO-CHAIR',
      name: 'ErgoPulse Mesh Desk Chair',
      description: 'High-back lumbar support ergonomic task chair',
      price: 450.00,
      costPrice: 195.00,
      active: true,
    },
  });

  // Create Warehouses
  const whEast = await prisma.warehouse.create({
    data: {
      tenantId: tenantAcme.id,
      code: 'WH-USEAST-01',
      name: 'Newark Distribution Hub',
      city: 'Newark',
      state: 'NJ',
      country: 'USA',
      latitude: 40.7357,
      longitude: -74.1724,
      active: true,
    },
  });

  const whWest = await prisma.warehouse.create({
    data: {
      tenantId: tenantAcme.id,
      code: 'WH-USWEST-01',
      name: 'Reno Fulfillment Center',
      city: 'Reno',
      state: 'NV',
      country: 'USA',
      latitude: 39.5296,
      longitude: -119.8138,
      active: true,
    },
  });

  // Inventory Stocks
  await prisma.warehouseStock.createMany({
    data: [
      { warehouseId: whEast.id, productId: prodHeadphones.id, quantity: 150, reservedQuantity: 12, reorderPoint: 25 },
      { warehouseId: whWest.id, productId: prodHeadphones.id, quantity: 200, reservedQuantity: 5, reorderPoint: 30 },
      { warehouseId: whEast.id, productId: prodDac.id, quantity: 80, reservedQuantity: 2, reorderPoint: 15 },
      { warehouseId: whWest.id, productId: prodDac.id, quantity: 110, reservedQuantity: 0, reorderPoint: 20 },
      { warehouseId: whEast.id, productId: prodChair.id, quantity: 45, reservedQuantity: 8, reorderPoint: 10 },
      { warehouseId: whWest.id, productId: prodChair.id, quantity: 30, reservedQuantity: 1, reorderPoint: 10 },
    ],
  });

  // Create Orders
  const order1 = await prisma.order.create({
    data: {
      tenantId: tenantAcme.id,
      orderNumber: 'ORD-2026-1001',
      customerId: customerUser.id,
      customerEmail: customerUser.email,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.PARTIALLY_FULFILLED,
      shippingAddress: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA',
      },
      subtotal: 389.49,
      discountTotal: 25.00,
      taxTotal: 29.16,
      shippingTotal: 15.00,
      grandTotal: 408.65,
      currency: 'USD',
      items: {
        create: [
          {
            productId: prodHeadphones.id,
            sku: prodHeadphones.sku,
            productName: prodHeadphones.name,
            unitPrice: 299.99,
            quantity: 1,
            discountAmount: 20.00,
            taxAmount: 22.40,
            subtotal: 279.99,
          },
          {
            productId: prodDac.id,
            sku: prodDac.sku,
            productName: prodDac.name,
            unitPrice: 89.50,
            quantity: 1,
            discountAmount: 5.00,
            taxAmount: 6.76,
            subtotal: 84.50,
          },
        ],
      },
      shipments: {
        create: {
          warehouseId: whEast.id,
          carrier: 'INTERNAL_FLEET',
          trackingNumber: 'TRK-PLS-9928174',
          status: 'IN_TRANSIT',
          shippedAt: new Date(Date.now() - 3600 * 24 * 1000),
        },
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      tenantId: tenantAcme.id,
      orderNumber: 'ORD-2026-1002',
      customerId: customerUser.id,
      customerEmail: customerUser.email,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.AUTHORIZED,
      fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
      shippingAddress: {
        street: '100 Market Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
      },
      subtotal: 450.00,
      discountTotal: 0.00,
      taxTotal: 38.25,
      shippingTotal: 45.00,
      grandTotal: 533.25,
      currency: 'USD',
      items: {
        create: [
          {
            productId: prodChair.id,
            sku: prodChair.sku,
            productName: prodChair.name,
            unitPrice: 450.00,
            quantity: 1,
            discountAmount: 0.00,
            taxAmount: 38.25,
            subtotal: 450.00,
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
  console.log(`Created Tenants: ${tenantAcme.name}, ${tenantOmni.name}`);
  console.log(`Created Warehouses: ${whEast.code}, ${whWest.code}`);
  console.log(`Created Orders: ${order1.orderNumber}, ${order2.orderNumber}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
