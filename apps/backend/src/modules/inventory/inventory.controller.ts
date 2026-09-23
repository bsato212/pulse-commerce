import { Controller, Get, Post, Body, Query, Param, UsePipes, ParseUUIDPipe } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { InventoryService } from './inventory.service';
import { ReserveStockDto, StockAdjustmentDto } from './dto/inventory.dto';
import { TenantId } from '../../common/decorators/current-user.decorator';

@Controller('inventory')
@UsePipes(new ZodValidationPipe())
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stocks')
  async getStocks(
    @TenantId() tenantId: string,
    @Query('warehouseId', new ParseUUIDPipe({ version: '4', optional: true })) warehouseId?: string,
  ) {
    return this.inventoryService.getStocks(tenantId, warehouseId);
  }

  @Get('warehouses')
  async getWarehouses(@TenantId() tenantId: string) {
    return this.inventoryService.getWarehouses(tenantId);
  }

  @Post('adjust')
  async adjustStock(@Body() dto: StockAdjustmentDto) {
    return this.inventoryService.adjustStock(dto);
  }

  @Post('reserve')
  async reserveStock(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserveStock(dto);
  }

  @Post('reservations/:id/release')
  async releaseReservation(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.inventoryService.releaseReservation(id);
  }
}
