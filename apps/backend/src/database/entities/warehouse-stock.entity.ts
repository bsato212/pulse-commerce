import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Product } from './product.entity';
import { StockReservation } from './stock-reservation.entity';

@Entity('warehouse_stocks')
@Unique(['warehouseId', 'productId'])
export class WarehouseStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  warehouseId: string;

  @Column()
  productId: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  reservedQuantity: number;

  @Column({ default: 10 })
  reorderPoint: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Warehouse, (w) => w.stocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @ManyToOne(() => Product, (p) => p.warehouseStock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany(() => StockReservation, (r) => r.warehouseStock)
  reservations: StockReservation[];
}
