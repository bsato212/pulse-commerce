import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
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
} from './entities';

import { InitialMigration1710000000000 } from './migrations/1710000000000-InitialMigration';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://pulse_user:pulse_password@localhost:5432/pulse_commerce?schema=public',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
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
});
