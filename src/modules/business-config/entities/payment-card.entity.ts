import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessConfig } from './business-config.entity';

@Entity({ name: 'payment_cards_info', schema: 'armsolutions' })
@Index(['configId'])
export class PaymentCard extends BaseEntity {
  @ManyToOne(() => BusinessConfig, (config) => config.paymentCards, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'config_id' })
  config: BusinessConfig;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  @Column({ type: 'varchar', length: 100 })
  bank: string;

  @Column({ name: 'card_number', type: 'varchar', length: 30, nullable: true })
  cardNumber: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  clabe: string | null;

  @Column({ type: 'varchar', length: 150 })
  beneficiary: string;
}
