import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';
import { QueryPaymentMethodDto } from './dto/query-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod } from './entities/payment-method.entity';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(
    businessId: string,
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.paymentMethodRepository.findOne({
      where: { code, businessId },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un método de pago con el código "${code}" en este negocio.`,
      );
    }

    const entity = this.paymentMethodRepository.create({
      businessId,
      code,
      name: dto.name.trim(),
      isActive: dto.isActive ?? true,
    });

    const saved = await this.paymentMethodRepository.save(entity);
    return PaymentMethodResponseDto.fromEntity(saved);
  }

  async findAll(
    businessId: string,
    query: QueryPaymentMethodDto,
  ): Promise<PaginatedResultDto<PaymentMethodResponseDto>> {
    const qb = this.paymentMethodRepository
      .createQueryBuilder('paymentMethod')
      .where('paymentMethod.businessId = :businessId', { businessId });

    if (query.isActive !== undefined) {
      qb.andWhere('paymentMethod.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(paymentMethod.name ILIKE :search OR paymentMethod.code ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    const sortBy = query.sortBy ?? 'createdAt';
    qb.orderBy(`paymentMethod.${sortBy}`, query.sortOrder)
      .skip(query.skip)
      .take(query.limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      items.map((item) => PaymentMethodResponseDto.fromEntity(item)),
      query.page,
      query.limit,
      totalItems,
    );
  }

  async findOne(
    businessId: string,
    id: string,
  ): Promise<PaymentMethodResponseDto> {
    const entity = await this.getEntityOrFail(businessId, id);
    return PaymentMethodResponseDto.fromEntity(entity);
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const entity = await this.getEntityOrFail(businessId, id);

    if (dto.code && dto.code.trim().toUpperCase() !== entity.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.paymentMethodRepository.findOne({
        where: { code, businessId },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un método de pago con el código "${code}" en este negocio.`,
        );
      }
      entity.code = code;
    }

    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    const saved = await this.paymentMethodRepository.save(entity);
    return PaymentMethodResponseDto.fromEntity(saved);
  }

  async remove(businessId: string, id: string): Promise<void> {
    const entity = await this.getEntityOrFail(businessId, id);
    entity.isActive = false;
    await this.paymentMethodRepository.save(entity);
  }

  private async getEntityOrFail(
    businessId: string,
    id: string,
  ): Promise<PaymentMethod> {
    const entity = await this.paymentMethodRepository.findOne({
      where: { id, businessId },
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró el método de pago con id "${id}".`,
      );
    }
    return entity;
  }
}
