import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { WarehouseStock, Warehouse, StockReservation } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([WarehouseStock, Warehouse, StockReservation])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
