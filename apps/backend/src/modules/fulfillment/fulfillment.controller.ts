import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import { OutboxService } from './events/outbox.service';
import { TenantId } from '../../common/decorators/current-user.decorator';

@Controller('fulfillment')
export class FulfillmentController {
  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly outboxService: OutboxService,
  ) {}

  @Get('shipments')
  async getShipments(@TenantId() tenantId: string) {
    return this.fulfillmentService.getShipments(tenantId);
  }

  @Post('orders/:orderId/ship')
  async shipOrder(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body('warehouseId', new ParseUUIDPipe({ version: '4' })) warehouseId: string,
    @Body('carrier') carrier?: string,
  ) {
    return this.fulfillmentService.createShipment(orderId, warehouseId, carrier);
  }

  @Post('outbox/process')
  async processOutbox() {
    const processed = await this.outboxService.publishPendingEvents();
    return { status: 'success', processedCount: processed };
  }
}
