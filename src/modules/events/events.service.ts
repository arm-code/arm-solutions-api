import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import {
  BusinessEventResponseDto,
  BusinessEventBalanceResponseDto,
} from './dto/business-event-response.dto';
import { CreateBusinessEventDto } from './dto/create-business-event.dto';
import { QueryBusinessEventDto } from './dto/query-business-event.dto';
import { UpdateBusinessEventDto } from './dto/update-business-event.dto';
import { BusinessEvent } from './entities/business-event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(BusinessEvent)
    private readonly eventRepository: Repository<BusinessEvent>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(
    ownerId: string,
    dto: CreateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    const entity = this.eventRepository.create({
      ownerId,
      name: dto.name.trim(),
      clientName: dto.clientName?.trim() ?? null,
      eventDate: dto.eventDate ?? null,
      notes: dto.notes?.trim() ?? null,
      isActive: true,
    });

    const saved = await this.eventRepository.save(entity);
    return BusinessEventResponseDto.fromEntity(saved);
  }

  async findAll(
    ownerId: string,
    query: QueryBusinessEventDto,
  ): Promise<PaginatedResultDto<BusinessEventResponseDto>> {
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.ownerId = :ownerId', { ownerId });

    if (query.isActive !== undefined) {
      qb.andWhere('event.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      qb.andWhere(
        '(event.name ILIKE :search OR event.clientName ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    const sortBy = query.sortBy ?? 'createdAt';
    qb.orderBy(`event.${sortBy}`, query.sortOrder)
      .skip(query.skip)
      .take(query.limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      items.map((item) => BusinessEventResponseDto.fromEntity(item)),
      query.page,
      query.limit,
      totalItems,
    );
  }

  async findOne(
    ownerId: string,
    id: string,
  ): Promise<BusinessEventBalanceResponseDto> {
    const entity = await this.getOwnedEntityOrFail(ownerId, id);

    const [incomeResult, expenseResult] = await Promise.all([
      this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'total')
        .where('t.businessEventId = :id AND t.type = :type', {
          id,
          type: TransactionType.INPUT,
        })
        .getRawOne<{ total: string }>(),
      this.transactionRepository
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'total')
        .where('t.businessEventId = :id AND t.type = :type', {
          id,
          type: TransactionType.OUTPUT,
        })
        .getRawOne<{ total: string }>(),
    ]);

    const totalIncome = Number(incomeResult?.total ?? 0);
    const totalExpenses = Number(expenseResult?.total ?? 0);

    const response = BusinessEventResponseDto.fromEntity(
      entity,
    ) as BusinessEventBalanceResponseDto;
    response.totalIncome = totalIncome;
    response.totalExpenses = totalExpenses;
    response.netBalance = totalIncome - totalExpenses;
    return response;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    const entity = await this.getOwnedEntityOrFail(ownerId, id);

    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.clientName !== undefined)
      entity.clientName = dto.clientName?.trim() ?? null;
    if (dto.eventDate !== undefined) entity.eventDate = dto.eventDate ?? null;
    if (dto.notes !== undefined) entity.notes = dto.notes?.trim() ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    const saved = await this.eventRepository.save(entity);
    return BusinessEventResponseDto.fromEntity(saved);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const entity = await this.getOwnedEntityOrFail(ownerId, id);
    entity.isActive = false; // soft delete
    await this.eventRepository.save(entity);
  }

  private async getOwnedEntityOrFail(
    ownerId: string,
    id: string,
  ): Promise<BusinessEvent> {
    // Se filtra por ownerId directamente en la query (no solo por id) para
    // que un recurso de OTRO usuario responda 404 en vez de 403: así no se
    // revela su existencia (se evita enumeración de recursos ajenos).
    const entity = await this.eventRepository.findOne({
      where: { id, ownerId },
    });
    if (!entity) {
      throw new NotFoundException(`No se encontró el evento con id "${id}".`);
    }
    return entity;
  }
}
