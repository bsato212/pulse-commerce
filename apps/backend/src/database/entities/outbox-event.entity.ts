import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { OutboxStatus } from '@pulsecommerce/shared-types';

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventType: string;

  @Column()
  aggregateId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  status: OutboxStatus;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
