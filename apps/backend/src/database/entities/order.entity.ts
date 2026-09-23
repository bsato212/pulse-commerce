import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { Shipment } from './shipment.entity';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@pulsecommerce/shared-types';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  customerId: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column()
  customerEmail: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: FulfillmentStatus,
    default: FulfillmentStatus.UNFULFILLED,
  })
  fulfillmentStatus: FulfillmentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grandTotal: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb' })
  shippingAddress: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Shipment, (shipment) => shipment.order)
  shipments: Shipment[];
}
