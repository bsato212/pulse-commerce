import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { PromotionEngineService } from './promotions/promotion-engine.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PricingService, PromotionEngineService],
  exports: [OrdersService, PricingService, PromotionEngineService],
})
export class OrdersModule {}
