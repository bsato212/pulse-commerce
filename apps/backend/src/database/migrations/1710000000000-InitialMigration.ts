import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1710000000000 implements MigrationInterface {
  name = 'InitialMigration1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM('ADMIN', 'WAREHOUSE_MANAGER', 'DISPATCHER', 'CUSTOMER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "orders_status_enum" AS ENUM('DRAFT', 'PENDING', 'CONFIRMED', 'ALLOCATING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "orders_paymentstatus_enum" AS ENUM('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "orders_fulfillmentstatus_enum" AS ENUM('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "outbox_events_status_enum" AS ENUM('PENDING', 'PROCESSED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "plan" character varying NOT NULL DEFAULT 'ENTERPRISE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'CUSTOMER',
        "passwordHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sku" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "costPrice" numeric(10,2) NOT NULL DEFAULT 0,
        "categoryId" uuid NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS "warehouses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "street" character varying NOT NULL,
        "city" character varying NOT NULL,
        "state" character varying NOT NULL,
        "postalCode" character varying NOT NULL,
        "country" character varying NOT NULL DEFAULT 'USA',
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_warehouses_code" UNIQUE ("code"),
        CONSTRAINT "PK_warehouses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_warehouses_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "warehouse_stocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "warehouseId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 0,
        "reservedQuantity" integer NOT NULL DEFAULT 0,
        "reorderPoint" integer NOT NULL DEFAULT 10,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_warehouse_stocks_wh_prod" UNIQUE ("warehouseId", "productId"),
        CONSTRAINT "PK_warehouse_stocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_warehouse_stocks_warehouse" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_warehouse_stocks_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "stock_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "warehouseStockId" uuid NOT NULL,
        "orderId" uuid,
        "quantity" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'RESERVED',
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_reservations_ws" FOREIGN KEY ("warehouseStockId") REFERENCES "warehouse_stocks"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        "orderNumber" character varying NOT NULL,
        "customerEmail" character varying NOT NULL,
        "status" "orders_status_enum" NOT NULL DEFAULT 'PENDING',
        "paymentStatus" "orders_paymentstatus_enum" NOT NULL DEFAULT 'PENDING',
        "fulfillmentStatus" "orders_fulfillmentstatus_enum" NOT NULL DEFAULT 'UNFULFILLED',
        "subtotal" numeric(10,2) NOT NULL,
        "discountTotal" numeric(10,2) NOT NULL DEFAULT 0,
        "taxTotal" numeric(10,2) NOT NULL DEFAULT 0,
        "shippingTotal" numeric(10,2) NOT NULL DEFAULT 0,
        "grandTotal" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'USD',
        "shippingAddress" jsonb NOT NULL,
        "billingAddress" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "sku" character varying NOT NULL,
        "productName" character varying NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "quantity" integer NOT NULL,
        "discount" numeric(10,2) NOT NULL DEFAULT 0,
        "subtotal" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS "shipments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "warehouseId" uuid NOT NULL,
        "carrier" character varying NOT NULL,
        "trackingNumber" character varying NOT NULL,
        "labelUrl" text,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "shippedAt" TIMESTAMP,
        "deliveredAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shipments_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shipments_warehouse" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS "outbox_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" character varying NOT NULL,
        "aggregateId" character varying NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "outbox_events_status_enum" NOT NULL DEFAULT 'PENDING',
        "retryCount" integer NOT NULL DEFAULT 0,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_events" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "webhook_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "url" character varying NOT NULL,
        "secret" character varying NOT NULL,
        "events" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_webhook_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_webhook_subscriptions_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "webhook_subscriptions";
      DROP TABLE IF EXISTS "outbox_events";
      DROP TABLE IF EXISTS "shipments";
      DROP TABLE IF EXISTS "order_items";
      DROP TABLE IF EXISTS "orders";
      DROP TABLE IF EXISTS "stock_reservations";
      DROP TABLE IF EXISTS "warehouse_stocks";
      DROP TABLE IF EXISTS "warehouses";
      DROP TABLE IF EXISTS "products";
      DROP TABLE IF EXISTS "categories";
      DROP TABLE IF EXISTS "users";
      DROP TABLE IF EXISTS "tenants";

      DROP TYPE IF EXISTS "outbox_events_status_enum";
      DROP TYPE IF EXISTS "orders_fulfillmentstatus_enum";
      DROP TYPE IF EXISTS "orders_paymentstatus_enum";
      DROP TYPE IF EXISTS "orders_status_enum";
      DROP TYPE IF EXISTS "users_role_enum";
    `);
  }
}
