import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookDispatcherService } from './webhooks/webhook-dispatcher.service';
import { WebhookSubscription } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookSubscription])],
  providers: [WebhookDispatcherService],
  exports: [WebhookDispatcherService],
})
export class HooksPendingModule {}
