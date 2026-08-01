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
    businessId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const [category, paymentMethod, businessEvent] = await Promise.all([
      this.getActiveCategoryOrFail(businessId, dto.categoryId),
      this.getActivePaymentMethodOrFail(businessId, dto.paymentMethodId),
      this.getOwnedEventOrFail(businessId, dto.businessEventId),
    ]);

    const entity = this.transactionRepository.create({
      businessId,
      ownerId: businessId, // mantenido para retrocompatibilidad
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
      await this.getOwnedEntityOrFail(businessId, saved.id),
    );
  }

  async findAll(
    businessId: string,
    query: QueryTransactionDto,
  ): Promise<PaginatedResultDto<TransactionResponseDto>> {
    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('transaction.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('transaction.businessEvent', 'businessEvent')
      .where('transaction.businessId = :businessId', { businessId });

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

  async getSummary(
    businessId: string,
  ): Promise<{ totalInputs: number; totalOutputs: number; balance: number }> {
    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        "SUM(CASE WHEN transaction.type = 'INPUT' THEN transaction.amount ELSE 0 END)",
        'totalInputs',
      )
      .addSelect(
        "SUM(CASE WHEN transaction.type = 'OUTPUT' THEN transaction.amount ELSE 0 END)",
        'totalOutputs',
      )
      .where('transaction.businessId = :businessId', { businessId });

    const result = await qb.getRawOne();

    const totalInputs = Number(result?.totalInputs || 0);
    const totalOutputs = Number(result?.totalOutputs || 0);
    const balance = totalInputs - totalOutputs;

    return { totalInputs, totalOutputs, balance };
  }

  async findOne(businessId: string, id: string): Promise<TransactionResponseDto> {
    const entity = await this.getOwnedEntityOrFail(businessId, id);
    return TransactionResponseDto.fromEntity(entity);
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const entity = await this.getOwnedEntityOrFail(businessId, id);

    if (dto.categoryId) {
      entity.category = await this.getActiveCategoryOrFail(businessId, dto.categoryId);
    }
    if (dto.paymentMethodId) {
      entity.paymentMethod = await this.getActivePaymentMethodOrFail(
        businessId,
        dto.paymentMethodId,
      );
    }
    if (dto.businessEventId !== undefined) {
      entity.businessEvent = await this.getOwnedEventOrFail(
        businessId,
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
      await this.getOwnedEntityOrFail(businessId, id),
    );
  }

  async remove(businessId: string, id: string): Promise<void> {
    const entity = await this.getOwnedEntityOrFail(businessId, id);
    await this.transactionRepository.remove(entity);
  }

  private async getOwnedEntityOrFail(
    businessId: string,
    id: string,
  ): Promise<Transaction> {
    const entity = await this.transactionRepository.findOne({
      where: { id, businessId },
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
    businessId: string,
    categoryId: string,
  ): Promise<TransactionCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, businessId },
    });
    if (!category) {
      throw new BadRequestException(
        `La categoría "${categoryId}" no existe en este negocio.`,
      );
    }
    if (!category.isActive) {
      throw new BadRequestException(
        `La categoría "${category.name}" está inactiva.`,
      );
    }
    return category;
  }

  private async getActivePaymentMethodOrFail(
    businessId: string,
    paymentMethodId: string,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, businessId },
    });
    if (!paymentMethod) {
      throw new BadRequestException(
        `El método de pago "${paymentMethodId}" no existe en este negocio.`,
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
    businessId: string,
    businessEventId?: string,
  ): Promise<BusinessEvent | null> {
    if (!businessEventId) return null;

    const event = await this.eventRepository.findOne({
      where: { id: businessEventId, businessId },
    });
    if (!event) {
      throw new BadRequestException(
        `El evento "${businessEventId}" no existe en este negocio.`,
      );
    }
    return event;
  }
}
