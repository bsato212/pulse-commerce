import { Module } from '@nestjs/common';
import { WebhookDispatcherService } from './webhooks/webhook-dispatcher.service';

@Module({
  providers: [WebhookDispatcherService],
  exports: [WebhookDispatcherService],
})
export class HooksPendingModule {}
