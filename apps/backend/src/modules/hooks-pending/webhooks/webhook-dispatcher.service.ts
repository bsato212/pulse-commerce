import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  async dispatchTenantWebhook(tenantId: string, event: string, data: Record<string, any>) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: {
        tenantId,
        active: true,
        events: { has: event },
      },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`No active webhook subscriptions for tenant ${tenantId} on event ${event}`);
      return [];
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const serialized = JSON.stringify(payload);

    this.logger.log(`Found ${subscriptions.length} webhook subscriptions for ${event}. Ready for dispatcher worker.`);
    return subscriptions.map((sub) => ({
      subscriptionId: sub.id,
      targetUrl: sub.url,
      signature: this.signPayload(serialized, sub.secret),
      payload,
    }));
  }
}
