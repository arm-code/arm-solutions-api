import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { CreateSalesNoteDto } from './dto/create-sales-note.dto';
import { QuerySalesNotesDto } from './dto/query-sales-notes.dto';
import { SalesNoteResponseDto } from './dto/sales-note-response.dto';
import { UpdateSalesNoteDto } from './dto/update-sales-note.dto';
import { SalesNoteItem } from './entities/sales-note-item.entity';
import { SalesNote } from './entities/sales-note.entity';
import { SalesNoteStatus } from './enums/sales-note-status.enum';

@Injectable()
export class SalesNotesService {
  constructor(
    @InjectRepository(SalesNote)
    private readonly noteRepository: Repository<SalesNote>,
    @InjectRepository(SalesNoteItem)
    private readonly itemRepository: Repository<SalesNoteItem>,
    @InjectRepository(BusinessEvent)
    private readonly eventRepository: Repository<BusinessEvent>,
  ) {}

  async create(
    ownerId: string,
    dto: CreateSalesNoteDto,
  ): Promise<SalesNoteResponseDto> {
    if (dto.eventId) {
      await this.verifyEventExists(dto.eventId);
    }

    const applyIva = dto.applyIva ?? false;
    const ivaRateNum = dto.ivaRate ?? 0.16;

    // Calcular montos de cada ítem
    const itemsData = dto.items.map((item) => {
      const qty = item.quantity;
      const price = item.unitPrice;
      const amount = Number((qty * price).toFixed(2));
      return this.itemRepository.create({
        concept: item.concept.trim(),
        quantity: qty.toFixed(2),
        unitPrice: price.toFixed(2),
        amount: amount.toFixed(2),
      });
    });

    const subtotalNum = itemsData.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const ivaAmountNum = applyIva
      ? Number((subtotalNum * ivaRateNum).toFixed(2))
      : 0;
    const totalNum = Number((subtotalNum + ivaAmountNum).toFixed(2));

    const noteEntity = this.noteRepository.create({
      ownerId,
      status: dto.status ?? SalesNoteStatus.NOTE,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone?.trim() ?? null,
      customerAddress: dto.customerAddress?.trim() ?? null,
      customerEmail: dto.customerEmail?.trim() ?? null,
      applyIva,
      ivaRate: ivaRateNum.toFixed(4),
      subtotal: subtotalNum.toFixed(2),
      ivaAmount: ivaAmountNum.toFixed(2),
      total: totalNum.toFixed(2),
      eventId: dto.eventId ?? null,
      notes: dto.notes?.trim() ?? null,
      isActive: true,
      items: itemsData,
    });

    const saved = await this.noteRepository.save(noteEntity);
    const reloaded = await this.getEntityOrFail(saved.id);
    return SalesNoteResponseDto.fromEntity(reloaded);
  }

  async findAll(
    query: QuerySalesNotesDto,
  ): Promise<PaginatedResultDto<SalesNoteResponseDto>> {
    const qb = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.items', 'items');

    if (query.isActive !== undefined) {
      qb.andWhere('note.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.status) {
      qb.andWhere('note.status = :status', { status: query.status });
    }

    if (query.eventId) {
      qb.andWhere('note.eventId = :eventId', { eventId: query.eventId });
    }

    if (query.search) {
      const cleanSearch = query.search.replace(/^(NV-|COT-)/i, '').trim();
      qb.andWhere(
        '(note.customerName ILIKE :search OR CAST(note.folioNumber AS TEXT) ILIKE :cleanSearch)',
        {
          search: `%${query.search.trim()}%`,
          cleanSearch: `%${cleanSearch}%`,
        },
      );
    }

    const sortBy = query.sortBy ?? 'createdAt';
    qb.orderBy(`note.${sortBy}`, query.sortOrder)
      .skip(query.skip)
      .take(query.limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      items.map((item) => SalesNoteResponseDto.fromEntity(item)),
      query.page,
      query.limit,
      totalItems,
    );
  }

  async findOne(id: string): Promise<SalesNoteResponseDto> {
    const entity = await this.getEntityOrFail(id);
    return SalesNoteResponseDto.fromEntity(entity);
  }

  async update(
    id: string,
    dto: UpdateSalesNoteDto,
  ): Promise<SalesNoteResponseDto> {
    const entity = await this.getEntityOrFail(id);

    if (dto.eventId !== undefined) {
      if (dto.eventId) {
        await this.verifyEventExists(dto.eventId);
      }
      entity.eventId = dto.eventId ?? null;
    }

    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.customerName !== undefined)
      entity.customerName = dto.customerName.trim();
    if (dto.customerPhone !== undefined)
      entity.customerPhone = dto.customerPhone?.trim() ?? null;
    if (dto.customerAddress !== undefined)
      entity.customerAddress = dto.customerAddress?.trim() ?? null;
    if (dto.customerEmail !== undefined)
      entity.customerEmail = dto.customerEmail?.trim() ?? null;
    if (dto.applyIva !== undefined) entity.applyIva = dto.applyIva;
    if (dto.ivaRate !== undefined)
      entity.ivaRate = dto.ivaRate.toFixed(4);
    if (dto.notes !== undefined) entity.notes = dto.notes?.trim() ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    // Si se enviaron ítems para actualizar/reemplazar
    if (dto.items && dto.items.length > 0) {
      // Eliminar ítems anteriores y reasignar
      await this.itemRepository.delete({ noteId: id });

      const newItems = dto.items.map((item) => {
        const qty = item.quantity ?? 1;
        const price = item.unitPrice ?? 0;
        const amount = Number((qty * price).toFixed(2));
        return this.itemRepository.create({
          noteId: id,
          concept: item.concept?.trim() ?? '',
          quantity: qty.toFixed(2),
          unitPrice: price.toFixed(2),
          amount: amount.toFixed(2),
        });
      });

      entity.items = newItems;
    }

    // Recalcular montos finales
    const applyIva = entity.applyIva;
    const ivaRateNum = Number(entity.ivaRate);
    const itemsList = entity.items || [];
    const subtotalNum = itemsList.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const ivaAmountNum = applyIva
      ? Number((subtotalNum * ivaRateNum).toFixed(2))
      : 0;
    const totalNum = Number((subtotalNum + ivaAmountNum).toFixed(2));

    entity.subtotal = subtotalNum.toFixed(2);
    entity.ivaAmount = ivaAmountNum.toFixed(2);
    entity.total = totalNum.toFixed(2);

    await this.noteRepository.save(entity);
    const reloaded = await this.getEntityOrFail(id);
    return SalesNoteResponseDto.fromEntity(reloaded);
  }

  async updateStatus(
    id: string,
    status: SalesNoteStatus,
  ): Promise<SalesNoteResponseDto> {
    const entity = await this.getEntityOrFail(id);
    entity.status = status;
    await this.noteRepository.save(entity);
    const reloaded = await this.getEntityOrFail(id);
    return SalesNoteResponseDto.fromEntity(reloaded);
  }

  async remove(id: string): Promise<SalesNoteResponseDto> {
    const entity = await this.getEntityOrFail(id);
    await this.noteRepository.remove(entity);
    return SalesNoteResponseDto.fromEntity(entity);
  }

  private async getEntityOrFail(id: string): Promise<SalesNote> {
    const entity = await this.noteRepository.findOne({
      where: { id },
      relations: ['items', 'event'],
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró la nota/cotización con id "${id}".`,
      );
    }
    return entity;
  }

  private async verifyEventExists(eventId: string): Promise<void> {
    const exists = await this.eventRepository.existsBy({ id: eventId });
    if (!exists) {
      throw new NotFoundException(
        `No se encontró el evento con id "${eventId}".`,
      );
    }
  }
}
