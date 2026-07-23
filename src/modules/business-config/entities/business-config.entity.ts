import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentCard } from './payment-card.entity';

@Entity({ name: 'business_configs', schema: 'armsolutions' })
export class BusinessConfig extends BaseEntity {
  @Column({ type: 'varchar', length: 150, default: 'Eventos Mendoza' })
  name: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  whatsapp: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  services: string[];

  @Column({ name: 'coverage_areas', type: 'text', array: true, default: '{}' })
  coverageAreas: string[];

  @Column({ name: 'terms_and_conditions', type: 'text', nullable: true })
  termsAndConditions: string | null;

  @OneToMany(() => PaymentCard, (card) => card.config, {
    cascade: true,
    eager: true,
  })
  paymentCards: PaymentCard[];
}
