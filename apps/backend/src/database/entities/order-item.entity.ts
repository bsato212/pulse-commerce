import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  productId: string;

  @Column()
  sku: string;

  @Column()
  productName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
