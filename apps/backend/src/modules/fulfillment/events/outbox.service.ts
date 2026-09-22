import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { OutboxStatus } from '@prisma/client';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async publishPendingEvents(): Promise<number> {
    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: { status: OutboxStatus.PENDING },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingEvents.length === 0) {
      return 0;
    }

    this.logger.log(`Dispatching ${pendingEvents.length} pending outbox events...`);

    // Process batch of pending domain events
    await Promise.all(
      pendingEvents.map(async (event) => {
        await this.dispatchSingleEvent(event);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.PROCESSED,
            processedAt: new Date(),
          },
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
