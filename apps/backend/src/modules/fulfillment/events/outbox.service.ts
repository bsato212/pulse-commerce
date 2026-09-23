import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent } from '../../../database/entities';
import { OutboxStatus } from '@pulsecommerce/shared-types';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  async publishPendingEvents(): Promise<number> {
    const pendingEvents = await this.outboxRepo.find({
      where: { status: OutboxStatus.PENDING },
      take: 50,
      order: { createdAt: 'ASC' },
    });

    if (pendingEvents.length === 0) {
      return 0;
    }

    this.logger.log(`Dispatching ${pendingEvents.length} pending outbox events...`);

    // Process batch of pending domain events
    await Promise.all(
      pendingEvents.map(async (event) => {
        await this.dispatchSingleEvent(event);
        await this.outboxRepo.update(event.id, {
          status: OutboxStatus.PROCESSED,
          processedAt: new Date(),
        });
      }),
    );

    return pendingEvents.length;
  }

  private async dispatchSingleEvent(event: any) {
    this.logger.debug(`Dispatching event ${event.eventType} for aggregate ${event.aggregateId}`);
    // Simulate event handler processing
    if (event.payload?.failSimulate) {
      throw new Error(`External webhook gateway timeout during event ${event.id}`);
    }
  }
}
