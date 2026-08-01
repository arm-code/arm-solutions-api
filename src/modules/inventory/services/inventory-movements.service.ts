import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';
import { InventoryMovementResponseDto } from '../dto/movement/inventory-movement-response.dto';
import { CreateInventoryMovementDto } from '../dto/movement/create-inventory-movement.dto';
import { QueryInventoryMovementsDto } from '../dto/movement/query-inventory-movements.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    ownerId: string,
    query: QueryInventoryMovementsDto,
  ): Promise<PaginatedResultDto<InventoryMovementResponseDto>> {
    const qb = this.movementRepo
      .createQueryBuilder('mv')
      .leftJoinAndSelect('mv.item', 'item')
      .leftJoinAndSelect('mv.originLocation', 'origin')
      .leftJoinAndSelect('mv.destinationLocation', 'dest')
      .where('mv.ownerId = :ownerId', { ownerId });

    if (query.itemId) {
      qb.andWhere('mv.itemId = :itemId', { itemId: query.itemId });
    }

    if (query.type) {
      qb.andWhere('mv.type = :type', { type: query.type });
    }

    if (query.startDate) {
      qb.andWhere('mv.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      // Incluir el día completo del endDate
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('mv.createdAt <= :endDate', { endDate: end });
    }

    qb.orderBy('mv.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    const [movements, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      movements.map(InventoryMovementResponseDto.fromEntity),
      query.page,
      query.limit,
      totalItems,
    );
  }

  /**
   * Registra un movimiento de stock de forma transaccional.
   * El stock del ítem se recalcula y persiste dentro de la misma transacción.
   *
   * Reglas por tipo:
   * - `in`:         stockTotal++, stockAvailable++
   * - `out`:        stockTotal--, stockAvailable-- (valida no negativo)
   * - `transfer`:   cambia locationId del ítem (no altera cantidades)
   * - `adjustment`: reemplaza stockTotal y recalcula stockAvailable
   *                 = quantity - stockReserved - stockRented
   */
  async create(
    ownerId: string,
    dto: CreateInventoryMovementDto,
  ): Promise<InventoryMovementResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloquear el ítem para evitar condiciones de carrera
      const item = await queryRunner.manager
        .createQueryBuilder(InventoryItem, 'item')
        .setLock('pessimistic_write')
        .where('item.id = :id AND item.ownerId = :ownerId', {
          id: dto.itemId,
          ownerId,
        })
        .getOne();

      if (!item) {
        throw new NotFoundException(
          `No se encontró el ítem con id "${dto.itemId}".`,
        );
      }

      // 2. Snapshot antes del movimiento
      const snapshotBefore = {
        total: item.stockTotal,
        available: item.stockAvailable,
        reserved: item.stockReserved,
        rented: item.stockRented,
      };

      // 3. Aplicar lógica de stock según tipo
      switch (dto.type) {
        case InventoryMovementType.IN:
          item.stockTotal += dto.quantity;
          item.stockAvailable += dto.quantity;
          break;

        case InventoryMovementType.OUT:
          if (item.stockAvailable < dto.quantity) {
            throw new BadRequestException(
              `Stock insuficiente. Disponible: ${item.stockAvailable}, solicitado: ${dto.quantity}.`,
            );
          }
          item.stockTotal -= dto.quantity;
          item.stockAvailable -= dto.quantity;
          break;

        case InventoryMovementType.TRANSFER:
          // Solo cambia la ubicación del ítem; las cantidades no varían
          if (dto.destinationLocationId) {
            item.locationId = dto.destinationLocationId;
          }
          break;

        case InventoryMovementType.ADJUSTMENT:
          // Ajuste absoluto: quantity = nuevo stockTotal
          item.stockTotal = dto.quantity;
          item.stockAvailable = Math.max(
            0,
            dto.quantity - item.stockReserved - item.stockRented,
          );
          break;
      }

      // 4. Snapshot después del movimiento
      const snapshotAfter = {
        total: item.stockTotal,
        available: item.stockAvailable,
        reserved: item.stockReserved,
        rented: item.stockRented,
      };

      // 5. Persistir cambios en el ítem
      await queryRunner.manager.save(InventoryItem, item);

      // 6. Crear y persistir el movimiento con snapshots
      const movement = queryRunner.manager.create(InventoryMovement, {
        ownerId,
        itemId: dto.itemId,
        type: dto.type,
        quantity: dto.quantity,
        originLocationId: dto.originLocationId ?? null,
        destinationLocationId: dto.destinationLocationId ?? null,
        reason: dto.reason?.trim() ?? null,
        snapshotStockBefore: snapshotBefore,
        snapshotStockAfter: snapshotAfter,
      });

      const savedMovement = await queryRunner.manager.save(
        InventoryMovement,
        movement,
      );

      await queryRunner.commitTransaction();

      // 7. Recargar el movimiento con relaciones para la respuesta
      const full = await this.movementRepo.findOne({
        where: { id: savedMovement.id },
        relations: ['item', 'originLocation', 'destinationLocation'],
      });

      return InventoryMovementResponseDto.fromEntity(full!);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
