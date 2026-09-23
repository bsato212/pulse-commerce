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
import { WarehouseStock } from './warehouse-stock.entity';
import { Shipment } from './shipment.entity';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  street: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  postalCode: string;

  @Column({ default: 'USA' })
  country: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.warehouses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => WarehouseStock, (ws) => ws.warehouse)
  stocks: WarehouseStock[];

  @OneToMany(() => Shipment, (shipment) => shipment.warehouse)
  shipments: Shipment[];
}
