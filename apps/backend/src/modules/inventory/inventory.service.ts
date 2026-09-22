import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReserveStockDto, StockAdjustmentDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStocks(tenantId: string, warehouseId?: string) {
    const where: any = {
      warehouse: { tenantId },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const records = await this.prisma.warehouseStock.findMany({
      where,
      include: {
        warehouse: true,
        product: true,
      },
      orderBy: [{ warehouse: { code: 'asc' } }, { product: { name: 'asc' } }],
    });

    return records.map((record) => ({
      id: record.id,
      warehouseId: record.warehouseId,
      warehouseName: record.warehouse.name,
      warehouseCode: record.warehouse.code,
      productId: record.productId,
      productName: record.product.name,
      sku: record.product.sku,
      quantity: record.quantity,
      reservedQuantity: record.reservedQuantity,
      availableQuantity: Math.max(0, record.quantity - record.reservedQuantity),
      reorderPoint: record.reorderPoint,
      isLowStock: (record.quantity - record.reservedQuantity) <= record.reorderPoint,
    }));
  }

  async getWarehouses(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId, active: true },
      include: {
        _count: {
          select: { stock: true, shipments: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async adjustStock(dto: StockAdjustmentDto) {
    const stock = await this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock record not found for warehouse and product combination');
    }

    const newQuantity = stock.quantity + dto.quantityDelta;
    if (newQuantity < stock.reservedQuantity) {
      throw new BadRequestException(
        `Cannot reduce stock below current reserved quantity (${stock.reservedQuantity}). Resulting: ${newQuantity}`,
      );
    }

    const updated = await this.prisma.warehouseStock.update({
      where: { id: stock.id },
      data: { quantity: newQuantity },
    });

    this.logger.log(
      `Stock adjusted for product ${dto.productId} in warehouse ${dto.warehouseId}. Delta: ${dto.quantityDelta}, New total: ${newQuantity}, Reason: ${dto.reason}`,
    );

    return updated;
  }

  async reserveStock(dto: ReserveStockDto) {
    const { productId, warehouseId, quantity, orderId } = dto;

    const stock = await this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException(
        `Stock record not found for product ${productId} in warehouse ${warehouseId}`,
      );
    }

    const available = stock.quantity - stock.reservedQuantity;
    if (available < quantity) {
      throw new BadRequestException(
        `Insufficient available stock for product ${productId}. Requested: ${quantity}, Available: ${available}`,
      );
    }

    const updatedStock = await this.prisma.warehouseStock.update({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      data: {
        reservedQuantity: stock.reservedQuantity + quantity,
      },
    });

    const reservation = await this.prisma.stockReservation.create({
      data: {
        warehouseId,
        productId,
        orderId: orderId || null,
        quantity,
        status: 'RESERVED',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30-minute hold
      },
    });

    this.logger.log(
      `Stock reserved: ${quantity} units of product ${productId} in warehouse ${warehouseId}. ReservationId: ${reservation.id}`,
    );

    return {
      reservationId: reservation.id,
      warehouseId,
      productId,
      quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      updatedStock,
    };
  }

  async releaseReservation(reservationId: string) {
    const reservation = await this.prisma.stockReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    if (reservation.status !== 'RESERVED') {
      throw new BadRequestException(`Reservation ${reservationId} is already ${reservation.status}`);
    }

    await this.prisma.$transaction([
      this.prisma.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'RELEASED' },
      }),
      this.prisma.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId: reservation.warehouseId,
            productId: reservation.productId,
          },
        },
        data: {
          reservedQuantity: { decrement: reservation.quantity },
        },
      }),
    ]);

    this.logger.log(`Released reservation ${reservationId}`);
    return { success: true, reservationId };
  }
}
