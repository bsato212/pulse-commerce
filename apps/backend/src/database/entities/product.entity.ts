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
import { Category } from './category.entity';
import { WarehouseStock } from './warehouse-stock.entity';
import { OrderItem } from './order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPrice: number;

  @Column()
  categoryId: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => WarehouseStock, (ws) => ws.product)
  warehouseStock: WarehouseStock[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];
}
