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

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.paymentMethodRepository.findOne({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un método de pago con el código "${code}".`,
      );
    }

    const entity = this.paymentMethodRepository.create({
      code,
      name: dto.name.trim(),
      isActive: dto.isActive ?? true,
    });

    const saved = await this.paymentMethodRepository.save(entity);
    return PaymentMethodResponseDto.fromEntity(saved);
  }

  async findAll(
    query: QueryPaymentMethodDto,
  ): Promise<PaginatedResultDto<PaymentMethodResponseDto>> {
    const qb = this.paymentMethodRepository.createQueryBuilder('paymentMethod');

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

  async findOne(id: string): Promise<PaymentMethodResponseDto> {
    const entity = await this.getEntityOrFail(id);
    return PaymentMethodResponseDto.fromEntity(entity);
  }

  async update(
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const entity = await this.getEntityOrFail(id);

    if (dto.code && dto.code.trim().toUpperCase() !== entity.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.paymentMethodRepository.findOne({
        where: { code },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un método de pago con el código "${code}".`,
        );
      }
      entity.code = code;
    }

    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    const saved = await this.paymentMethodRepository.save(entity);
    return PaymentMethodResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.getEntityOrFail(id);
    // Soft delete lógico: se desactiva en vez de borrar para preservar la
    // integridad referencial e historial de transacciones ya registradas.
    entity.isActive = false;
    await this.paymentMethodRepository.save(entity);
  }

  private async getEntityOrFail(id: string): Promise<PaymentMethod> {
    const entity = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró el método de pago con id "${id}".`,
      );
    }
    return entity;
  }
}
