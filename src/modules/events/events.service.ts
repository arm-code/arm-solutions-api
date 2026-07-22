import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import {
  BusinessEventBalanceResponseDto,
  BusinessEventResponseDto,
} from './dto/business-event-response.dto';
import { CreateBusinessEventDto } from './dto/create-business-event.dto';
import { QueryBusinessEventDto } from './dto/query-business-event.dto';
import { UpdateBusinessEventDto } from './dto/update-business-event.dto';
import { BusinessEvent } from './entities/business-event.entity';
import { EventStatus } from './enums/event-status.enum';

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
      eventDate: dto.eventDate,
      clientName: dto.clientName.trim(),
      clientPhone: dto.clientPhone?.trim() ?? null,
      eventAddress: dto.eventAddress.trim(),
      cost: dto.cost.toFixed(2),
      status: dto.status ?? EventStatus.PENDING,
      guaranteeDocument: dto.guaranteeDocument?.trim() ?? null,
      noteId: dto.noteId ?? null,
      notes: dto.notes?.trim() ?? null,
      isActive: true,
    });

    const saved = await this.eventRepository.save(entity);
    const reloaded = await this.getEntityOrFail(saved.id);
    return BusinessEventResponseDto.fromEntity(reloaded);
  }

  async findAll(
    _ownerId: string,
    query: QueryBusinessEventDto,
  ): Promise<PaginatedResultDto<BusinessEventResponseDto>> {
    const qb = this.eventRepository.createQueryBuilder('event');

    if (query.isActive !== undefined) {
      qb.andWhere('event.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.tab) {
      if (query.tab === 'upcoming') {
        qb.andWhere('event.status IN (:...statuses)', {
          statuses: [EventStatus.PENDING, EventStatus.DELIVERED],
        });
      } else if (query.tab === 'finished') {
        qb.andWhere('event.status = :status', {
          status: EventStatus.COLLECTED,
        });
      } else if (query.tab === 'cancelled') {
        qb.andWhere('event.status = :status', {
          status: EventStatus.CANCELLED,
        });
      }
    } else if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    if (query.search) {
      const cleanSearch = query.search.replace(/^EV-/i, '').trim();
      qb.andWhere(
        '(event.name ILIKE :search OR event.clientName ILIKE :search OR event.eventAddress ILIKE :search OR CAST(event.folioNumber AS TEXT) ILIKE :cleanSearch)',
        {
          search: `%${query.search.trim()}%`,
          cleanSearch: `%${cleanSearch}%`,
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
    _ownerId: string,
    id: string,
  ): Promise<BusinessEventBalanceResponseDto> {
    const entity = await this.getEntityOrFail(id);

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
    _ownerId: string,
    id: string,
    dto: UpdateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    const entity = await this.getEntityOrFail(id);

    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.eventDate !== undefined) entity.eventDate = dto.eventDate;
    if (dto.clientName !== undefined)
      entity.clientName = dto.clientName?.trim() ?? null;
    if (dto.clientPhone !== undefined)
      entity.clientPhone = dto.clientPhone?.trim() ?? null;
    if (dto.eventAddress !== undefined)
      entity.eventAddress = dto.eventAddress?.trim() ?? null;
    if (dto.cost !== undefined) entity.cost = dto.cost.toFixed(2);
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.guaranteeDocument !== undefined)
      entity.guaranteeDocument = dto.guaranteeDocument?.trim() ?? null;
    if (dto.noteId !== undefined) entity.noteId = dto.noteId ?? null;
    if (dto.notes !== undefined) entity.notes = dto.notes?.trim() ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    const saved = await this.eventRepository.save(entity);
    return BusinessEventResponseDto.fromEntity(saved);
  }

  async updateStatus(
    _ownerId: string,
    id: string,
    status: EventStatus,
  ): Promise<BusinessEventResponseDto> {
    const entity = await this.getEntityOrFail(id);
    entity.status = status;
    const saved = await this.eventRepository.save(entity);
    return BusinessEventResponseDto.fromEntity(saved);
  }

  async remove(_ownerId: string, id: string): Promise<BusinessEventResponseDto> {
    const entity = await this.getEntityOrFail(id);
    entity.status = EventStatus.CANCELLED;
    const saved = await this.eventRepository.save(entity);
    return BusinessEventResponseDto.fromEntity(saved);
  }

  private async getEntityOrFail(id: string): Promise<BusinessEvent> {
    const entity = await this.eventRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new NotFoundException(`No se encontró el evento con id "${id}".`);
    }
    return entity;
  }
}
