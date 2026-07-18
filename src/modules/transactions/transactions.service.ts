import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { TransactionCategory } from '../categories/entities/transaction-category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionCategory)
    private readonly categoryRepository: Repository<TransactionCategory>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(BusinessEvent)
    private readonly eventRepository: Repository<BusinessEvent>,
  ) {}

  async create(
    ownerId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const [category, paymentMethod, businessEvent] = await Promise.all([
      this.getActiveCategoryOrFail(dto.categoryId),
      this.getActivePaymentMethodOrFail(dto.paymentMethodId),
      this.getOwnedEventOrFail(ownerId, dto.businessEventId),
    ]);

    const entity = this.transactionRepository.create({
      ownerId,
      transactionDate: dto.transactionDate,
      type: dto.type,
      description: dto.description?.trim() ?? null,
      amount: dto.amount.toFixed(2),
      category,
      paymentMethod,
      businessEvent,
    });

    const saved = await this.transactionRepository.save(entity);
    return TransactionResponseDto.fromEntity(
      await this.getOwnedEntityOrFail(ownerId, saved.id),
    );
  }

  async findAll(
    ownerId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedResultDto<TransactionResponseDto>> {
    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('transaction.businessEvent', 'businessEvent')
      .where('transaction.ownerId = :ownerId', { ownerId });

    if (query.type) {
      qb.andWhere('transaction.type = :type', { type: query.type });
    }
    if (query.categoryId) {
      qb.andWhere('category.id = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.paymentMethodId) {
      qb.andWhere('paymentMethod.id = :paymentMethodId', {
        paymentMethodId: query.paymentMethodId,
      });
    }
    if (query.businessEventId) {
      qb.andWhere('businessEvent.id = :businessEventId', {
        businessEventId: query.businessEventId,
      });
    }
    if (query.dateFrom) {
      qb.andWhere('transaction.transactionDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }
    if (query.dateTo) {
      qb.andWhere('transaction.transactionDate <= :dateTo', {
        dateTo: query.dateTo,
      });
    }
    if (query.search) {
      qb.andWhere('transaction.description ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const sortableColumns: Record<string, string> = {
      transactionDate: 'transaction.transactionDate',
      amount: 'transaction.amount',
      createdAt: 'transaction.createdAt',
      folioNumber: 'transaction.folioNumber',
    };
    const sortColumn =
      sortableColumns[query.sortBy ?? ''] ?? 'transaction.transactionDate';
    qb.orderBy(sortColumn, query.sortOrder).skip(query.skip).take(query.limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      items.map((item) => TransactionResponseDto.fromEntity(item)),
      query.page,
      query.limit,
      totalItems,
    );
  }

  async findOne(ownerId: string, id: string): Promise<TransactionResponseDto> {
    const entity = await this.getOwnedEntityOrFail(ownerId, id);
    return TransactionResponseDto.fromEntity(entity);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const entity = await this.getOwnedEntityOrFail(ownerId, id);

    if (dto.categoryId) {
      entity.category = await this.getActiveCategoryOrFail(dto.categoryId);
    }
    if (dto.paymentMethodId) {
      entity.paymentMethod = await this.getActivePaymentMethodOrFail(
        dto.paymentMethodId,
      );
    }
    if (dto.businessEventId !== undefined) {
      entity.businessEvent = await this.getOwnedEventOrFail(
        ownerId,
        dto.businessEventId,
      );
    }
    if (dto.transactionDate !== undefined)
      entity.transactionDate = dto.transactionDate;
    if (dto.type !== undefined) entity.type = dto.type;
    if (dto.description !== undefined)
      entity.description = dto.description?.trim() ?? null;
    if (dto.amount !== undefined) entity.amount = dto.amount.toFixed(2);

    await this.transactionRepository.save(entity);
    return TransactionResponseDto.fromEntity(
      await this.getOwnedEntityOrFail(ownerId, id),
    );
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const entity = await this.getOwnedEntityOrFail(ownerId, id);
    // Delete físico: a diferencia de los catálogos, una transacción errónea
    // se elimina de verdad (no tiene sentido conservar un movimiento inválido).
    await this.transactionRepository.remove(entity);
  }

  private async getOwnedEntityOrFail(
    ownerId: string,
    id: string,
  ): Promise<Transaction> {
    const entity = await this.transactionRepository.findOne({
      where: { id, ownerId },
      relations: { category: true, paymentMethod: true, businessEvent: true },
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró la transacción con id "${id}".`,
      );
    }
    return entity;
  }

  private async getActiveCategoryOrFail(
    categoryId: string,
  ): Promise<TransactionCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException(`La categoría "${categoryId}" no existe.`);
    }
    if (!category.isActive) {
      throw new BadRequestException(
        `La categoría "${category.name}" está inactiva.`,
      );
    }
    return category;
  }

  private async getActivePaymentMethodOrFail(
    paymentMethodId: string,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId },
    });
    if (!paymentMethod) {
      throw new BadRequestException(
        `El método de pago "${paymentMethodId}" no existe.`,
      );
    }
    if (!paymentMethod.isActive) {
      throw new BadRequestException(
        `El método de pago "${paymentMethod.name}" está inactivo.`,
      );
    }
    return paymentMethod;
  }

  private async getOwnedEventOrFail(
    ownerId: string,
    businessEventId?: string,
  ): Promise<BusinessEvent | null> {
    if (!businessEventId) return null;

    // Se filtra también por ownerId para impedir asociar una transacción a
    // un evento que pertenece a otro usuario.
    const event = await this.eventRepository.findOne({
      where: { id: businessEventId, ownerId },
    });
    if (!event) {
      throw new BadRequestException(
        `El evento "${businessEventId}" no existe o no te pertenece.`,
      );
    }
    return event;
  }
}
