import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WarehouseStock } from './warehouse-stock.entity';

@Entity('stock_reservations')
export class StockReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  warehouseStockId: string;

  @Column({ nullable: true })
  orderId: string | null;

  @Column()
  quantity: number;

  @Column({ default: 'RESERVED' })
  status: string;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => WarehouseStock, (ws) => ws.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseStockId' })
  warehouseStock: WarehouseStock;
}
