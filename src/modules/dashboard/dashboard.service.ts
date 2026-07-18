import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';

interface SumByPaymentMethodRow {
  paymentMethodCode: string;
  type: TransactionType;
  total: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Calcula los mismos KPIs de la hoja `dashboard` del Excel:
   *   A3 =C3-E3                                            -> netBalance
   *   C3 =SUMIF(io!C:C, "Input", io!G:G)                    -> totalIncome
   *   E3 =SUMIF(io!C:C, "Output", io!G:G)                   -> totalExpenses
   *   G3 =SUMIFS(... CASH) - SUMIFS(... CASH)               -> availableCash
   *   I3 =SUMIFS(... TRANSFER) - SUMIFS(... TRANSFER)       -> availableTransfer
   */
  async getSummary(
    ownerId: string,
    query: DashboardQueryDto,
  ): Promise<DashboardSummaryResponseDto> {
    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin('t.paymentMethod', 'paymentMethod')
      .select('paymentMethod.code', 'paymentMethodCode')
      .addSelect('t.type', 'type')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.ownerId = :ownerId', { ownerId })
      .groupBy('paymentMethod.code')
      .addGroupBy('t.type');

    if (query.dateFrom) {
      qb.andWhere('t.transactionDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }
    if (query.dateTo) {
      qb.andWhere('t.transactionDate <= :dateTo', { dateTo: query.dateTo });
    }

    const rows = await qb.getRawMany<SumByPaymentMethodRow>();

    const sumFor = (
      paymentMethodCode: string | null,
      type: TransactionType,
    ): number =>
      rows
        .filter(
          (row) =>
            row.type === type &&
            (paymentMethodCode === null ||
              row.paymentMethodCode === paymentMethodCode),
        )
        .reduce((acc, row) => acc + Number(row.total), 0);

    const totalIncome = sumFor(null, TransactionType.INPUT);
    const totalExpenses = sumFor(null, TransactionType.OUTPUT);
    const cashIncome = sumFor('CASH', TransactionType.INPUT);
    const cashExpenses = sumFor('CASH', TransactionType.OUTPUT);
    const transferIncome = sumFor('TRANSFER', TransactionType.INPUT);
    const transferExpenses = sumFor('TRANSFER', TransactionType.OUTPUT);

    const summary = new DashboardSummaryResponseDto();
    summary.totalIncome = totalIncome;
    summary.totalExpenses = totalExpenses;
    summary.netBalance = totalIncome - totalExpenses;
    summary.availableCash = cashIncome - cashExpenses;
    summary.availableTransfer = transferIncome - transferExpenses;
    return summary;
  }
}
