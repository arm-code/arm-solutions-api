import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

/**
 * Catálogo de métodos de pago (CASH, TRANSFER, ...).
 *
 * Se extrajo como entidad independiente (normalización 3FN) a partir de la
 * columna `PAYMENT METHOD` de la hoja `io`, que originalmente era texto
 * libre validado solo por un dropdown de Excel. Como catálogo en base de
 * datos permite: agregar nuevos métodos sin tocar código, desactivar
 * métodos obsoletos sin borrar histórico, y evitar errores de tipeo.
 */
@Entity({ name: 'payment_methods', schema: 'armsolutions' })
export class PaymentMethod extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  code: string; // CASH, TRANSFER, CARD...

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.paymentMethod)
  transactions: Transaction[];
}
