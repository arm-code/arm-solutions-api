import { ApiProperty } from '@nestjs/swagger';

/**
 * Réplica de los KPIs de la hoja `dashboard` del Excel original, calculados
 * con SQL (equivalentes a las fórmulas `SUMIF`/`SUMIFS` originales) en vez
 * de mantenerse como celdas frágiles dependientes del orden de las filas.
 */
export class DashboardSummaryResponseDto {
  @ApiProperty({
    example: 1550,
    description: 'Suma de todos los movimientos INPUT.',
  })
  totalIncome: number;

  @ApiProperty({
    example: 0,
    description: 'Suma de todos los movimientos OUTPUT.',
  })
  totalExpenses: number;

  @ApiProperty({
    example: 1550,
    description: 'totalIncome - totalExpenses (SALDO/GANANCIA NETA).',
  })
  netBalance: number;

  @ApiProperty({
    example: 0,
    description: 'Efectivo disponible (INPUT - OUTPUT en método CASH).',
  })
  availableCash: number;

  @ApiProperty({
    example: 1550,
    description:
      'Saldo disponible por transferencia (INPUT - OUTPUT en método TRANSFER).',
  })
  availableTransfer: number;
}
