import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WarehouseStock, Warehouse, StockReservation } from '../../database/entities';
import { ReserveStockDto, StockAdjustmentDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(WarehouseStock)
    private readonly stockRepo: Repository<WarehouseStock>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    @InjectRepository(StockReservation)
    private readonly reservationRepo: Repository<StockReservation>,
    private readonly dataSource: DataSource,
  ) {}

  async getStocks(tenantId: string, warehouseId?: string) {
    const qb = this.stockRepo
      .createQueryBuilder('ws')
      .innerJoinAndSelect('ws.warehouse', 'w')
      .innerJoinAndSelect('ws.product', 'p')
      .where('w.tenantId = :tenantId', { tenantId });

    if (warehouseId) {
      qb.andWhere('ws.warehouseId = :warehouseId', { warehouseId });
    }

    qb.orderBy('w.code', 'ASC').addOrderBy('p.name', 'ASC');

    const records = await qb.getMany();

    return records.map((record) => {
      const qty = Number(record.quantity);
      const res = Number(record.reservedQuantity);
      return {
        id: record.id,
        warehouseId: record.warehouseId,
        warehouseName: record.warehouse.name,
        warehouseCode: record.warehouse.code,
        productId: record.productId,
        productName: record.product.name,
        sku: record.product.sku,
        quantity: qty,
        reservedQuantity: res,
        availableQuantity: Math.max(0, qty - res),
        reorderPoint: record.reorderPoint,
        isLowStock: qty - res <= record.reorderPoint,
      };
    });
  }

  async getWarehouses(tenantId: string) {
    return this.warehouseRepo
      .createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.stocks', 'stocks')
      .leftJoinAndSelect('warehouse.shipments', 'shipments')
      .where('warehouse.tenantId = :tenantId', { tenantId })
      .andWhere('warehouse.active = :active', { active: true })
      .orderBy('warehouse.code', 'ASC')
      .getMany();
  }

  async adjustStock(dto: StockAdjustmentDto) {
    const stock = await this.stockRepo.findOne({
      where: {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock record not found for warehouse and product combination');
    }

    const newQuantity = Number(stock.quantity) + dto.quantityDelta;
    if (newQuantity < Number(stock.reservedQuantity)) {
      throw new BadRequestException(
        `Cannot reduce stock below current reserved quantity (${stock.reservedQuantity}). Resulting: ${newQuantity}`,
      );
    }

    stock.quantity = newQuantity;
    const updated = await this.stockRepo.save(stock);

    this.logger.log(
      `Stock adjusted for product ${dto.productId} in warehouse ${dto.warehouseId}. Delta: ${dto.quantityDelta}, New total: ${newQuantity}, Reason: ${dto.reason}`,
    );

    return updated;
  }

  async reserveStock(dto: ReserveStockDto) {
    const { productId, warehouseId, quantity, orderId } = dto;

    const stock = await this.stockRepo.findOne({
      where: {
        warehouseId,
        productId,
      },
    });

    if (!stock) {
      throw new NotFoundException(
        `Stock record not found for product ${productId} in warehouse ${warehouseId}`,
      );
    }

    const available = Number(stock.quantity) - Number(stock.reservedQuantity);
    if (available < quantity) {
      throw new BadRequestException(
        `Insufficient available stock for product ${productId}. Requested: ${quantity}, Available: ${available}`,
      );
    }

    stock.reservedQuantity = Number(stock.reservedQuantity) + quantity;
    const updatedStock = await this.stockRepo.save(stock);

    const reservation = this.reservationRepo.create({
      warehouseStockId: stock.id,
      orderId: orderId || null,
      quantity,
      status: 'RESERVED',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30-minute hold
    });

    const savedReservation = await this.reservationRepo.save(reservation);

    this.logger.log(
      `Stock reserved: ${quantity} units of product ${productId} in warehouse ${warehouseId}. ReservationId: ${savedReservation.id}`,
    );

    return {
      reservationId: savedReservation.id,
      warehouseId,
      productId,
      quantity,
      status: savedReservation.status,
      expiresAt: savedReservation.expiresAt.toISOString(),
      updatedStock,
    };
  }

  async releaseReservation(reservationId: string) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
      relations: ['warehouseStock'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    if (reservation.status !== 'RESERVED') {
      throw new BadRequestException(
        `Reservation ${reservationId} is already ${reservation.status}`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      reservation.status = 'RELEASED';
      await manager.save(reservation);

      const stock = reservation.warehouseStock;
      if (stock) {
        stock.reservedQuantity = Math.max(0, Number(stock.reservedQuantity) - reservation.quantity);
        await manager.save(stock);
      }
    });

    this.logger.log(`Released reservation ${reservationId}`);
    return { success: true, reservationId };
  }
}
