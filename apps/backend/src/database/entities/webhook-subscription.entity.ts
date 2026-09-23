import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  url: string;

  @Column()
  secret: string;

  @Column('simple-array')
  events: string[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.webhookSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
