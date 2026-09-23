import { Controller, Get, Post, Param, Body, Query, UsePipes, ParseUUIDPipe } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import {
  CurrentUser,
  TenantId,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrderStatus } from '@pulsecommerce/shared-types';

@Controller('orders')
@UsePipes(new ZodValidationPipe())
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders(@TenantId() tenantId: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.listOrders(tenantId, status);
  }

  @Get(':id')
  async getOrder(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.ordersService.getOrderById(id, tenantId);
  }

  @Post()
  async createOrder(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(tenantId, user.id, dto);
  }

  @Post(':id/status')
  async transitionStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.transitionStatus(id, tenantId, dto);
  }

  @Get(':id/invoice')
  async getOrderInvoicePdf(@Param('id', new ParseUUIDPipe({ version: '4' })) orderId: string) {
    return this.ordersService.generateInvoicePdf(orderId);
  }
}
