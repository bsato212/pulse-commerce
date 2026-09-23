import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookSubscription } from '../../../database/entities';
import * as crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly webhookRepo: Repository<WebhookSubscription>,
  ) {}

  signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  async dispatchTenantWebhook(tenantId: string, event: string, data: Record<string, any>) {
    const subscriptions = await this.webhookRepo.find({
      where: {
        tenantId,
        active: true,
      },
    });

    const matching = subscriptions.filter((sub) => sub.events && sub.events.includes(event));

    if (matching.length === 0) {
      this.logger.debug(`No active webhook subscriptions for tenant ${tenantId} on event ${event}`);
      return [];
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const serialized = JSON.stringify(payload);

    this.logger.log(
      `Found ${matching.length} webhook subscriptions for ${event}. Ready for dispatcher worker.`,
    );
    return matching.map((sub) => ({
      subscriptionId: sub.id,
      targetUrl: sub.url,
      signature: this.signPayload(serialized, sub.secret),
      payload,
    }));
  }
}
