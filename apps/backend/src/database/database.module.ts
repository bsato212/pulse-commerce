import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url:
          config.get<string>('DATABASE_URL') ||
          'postgresql://pulse_user:pulse_password@localhost:5432/pulse_commerce?schema=public',
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
        migrationsRun: true,
        synchronize: false,
        logging: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([
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
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
