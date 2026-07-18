import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { BusinessEvent } from '../../events/entities/business-event.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { TransactionCategory } from '../../categories/entities/transaction-category.entity';

/**
 * Tabla de hechos: cada fila es un movimiento de ingreso (INPUT) o egreso
 * (OUTPUT). Corresponde a la hoja `io` del Excel original, ya normalizada:
 *
 *  - `category`, `paymentMethod` y `businessEvent` -> FK a catálogos/entidades
 *    en vez de texto libre repetido.
 *  - `folioNumber` -> entero autoincremental generado por una SEQUENCE de
 *    Postgres (`transactions_folio_seq`), a partir del cual se construye el
 *    folio "FOL-0001" en la capa de presentación (DTO). Esto evita
 *    condiciones de carrera y reemplaza la fórmula frágil de Excel
 *    `="FOL-" & TEXT(MID(A4,5,4)+1,"0000")`, que dependía de leer la fila
 *    anterior y se rompía al insertar/eliminar filas.
 *  - `ownerId` -> multi-tenant: cada usuario de Supabase solo ve sus propios
 *    movimientos (se refuerza con Row Level Security en la base de datos).
 */
@Entity({ name: 'transactions', schema: 'armsolutions' })
@Index(['ownerId', 'transactionDate'])
@Index(['ownerId', 'type'])
export class Transaction extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string; // referencia a auth.users(id) de Supabase

  @Column({ name: 'folio_number', type: 'integer' })
  @Index()
  folioNumber: number;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null; // CONCEPT/DESCRIPTION

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string; // numeric se mapea como string en TypeORM para no perder precisión

  @ManyToOne(() => TransactionCategory, (category) => category.transactions, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: TransactionCategory;

  @RelationId((transaction: Transaction) => transaction.category)
  categoryId: string;

  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.transactions,
    {
      eager: true,
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @RelationId((transaction: Transaction) => transaction.paymentMethod)
  paymentMethodId: string;

  @ManyToOne(
    () => BusinessEvent,
    (businessEvent) => businessEvent.transactions,
    {
      eager: true,
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'business_event_id' })
  businessEvent: BusinessEvent | null;

  @RelationId((transaction: Transaction) => transaction.businessEvent)
  businessEventId: string | null;

  /** Folio legible construido a partir de `folioNumber`, ej. "FOL-0001". */
  get folio(): string {
    return `FOL-${String(this.folioNumber).padStart(4, '0')}`;
  }
}
