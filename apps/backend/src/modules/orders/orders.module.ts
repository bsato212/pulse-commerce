import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { PromotionEngineService } from './promotions/promotion-engine.service';
import { Order, OrderItem, Product, OutboxEvent } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, OutboxEvent])],
  controllers: [OrdersController],
  providers: [OrdersService, PricingService, PromotionEngineService],
  exports: [OrdersService, PricingService, PromotionEngineService],
})
export class OrdersModule {}
