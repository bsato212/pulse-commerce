import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Warehouse } from './warehouse.entity';
import { Order } from './order.entity';
import { WebhookSubscription } from './webhook-subscription.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ default: 'ENTERPRISE' })
  plan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => Warehouse, (warehouse) => warehouse.tenant)
  warehouses: Warehouse[];

  @OneToMany(() => Order, (order) => order.tenant)
  orders: Order[];

  @OneToMany(() => WebhookSubscription, (sub) => sub.tenant)
  webhookSubscriptions: WebhookSubscription[];
}
