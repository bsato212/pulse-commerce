import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomLoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { HooksPendingModule } from './modules/hooks-pending/hooks-pending.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    CustomLoggerModule,
    DatabaseModule,
    CacheModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    FulfillmentModule,
    HooksPendingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
