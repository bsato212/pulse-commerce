import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import {
  CurrentUser,
  TenantId,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrderStatus } from '@pulsecommerce/shared-types';

@Controller('orders')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders(@TenantId() tenantId: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.listOrders(tenantId, status);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @TenantId() tenantId: string) {
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
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.transitionStatus(id, tenantId, dto);
  }

  @Get(':id/invoice')
  async getOrderInvoicePdf(@Param('id') orderId: string) {
    return this.ordersService.generateInvoicePdf(orderId);
  }
}
