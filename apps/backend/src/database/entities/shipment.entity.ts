import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Warehouse } from './warehouse.entity';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  warehouseId: string;

  @Column()
  carrier: string;

  @Column()
  trackingNumber: string;

  @Column({ type: 'text', nullable: true })
  labelUrl: string | null;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Warehouse, (w) => w.shipments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;
}
