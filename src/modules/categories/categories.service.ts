import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TransactionCategory } from './entities/transaction-category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(TransactionCategory)
    private readonly categoryRepository: Repository<TransactionCategory>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.categoryRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(
        `Ya existe una categoría con el código "${code}".`,
      );
    }

    const entity = this.categoryRepository.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.categoryRepository.save(entity);
    return CategoryResponseDto.fromEntity(saved);
  }

  async findAll(
    query: QueryCategoryDto,
  ): Promise<PaginatedResultDto<CategoryResponseDto>> {
    const qb = this.categoryRepository.createQueryBuilder('category');

    if (query.isActive !== undefined) {
      qb.andWhere('category.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(category.name ILIKE :search OR category.code ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    const sortBy = query.sortBy ?? 'createdAt';
    qb.orderBy(`category.${sortBy}`, query.sortOrder)
      .skip(query.skip)
      .take(query.limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      items.map((item) => CategoryResponseDto.fromEntity(item)),
      query.page,
      query.limit,
      totalItems,
    );
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const entity = await this.getEntityOrFail(id);
    return CategoryResponseDto.fromEntity(entity);
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const entity = await this.getEntityOrFail(id);

    if (dto.code && dto.code.trim().toUpperCase() !== entity.code) {
      const code = dto.code.trim().toUpperCase();
      const existing = await this.categoryRepository.findOne({
        where: { code },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe una categoría con el código "${code}".`,
        );
      }
      entity.code = code;
    }

    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.description !== undefined)
      entity.description = dto.description?.trim() ?? null;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;

    const saved = await this.categoryRepository.save(entity);
    return CategoryResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.getEntityOrFail(id);
    entity.isActive = false; // soft delete, preserva histórico de transacciones
    await this.categoryRepository.save(entity);
  }

  private async getEntityOrFail(id: string): Promise<TransactionCategory> {
    const entity = await this.categoryRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró la categoría con id "${id}".`,
      );
    }
    return entity;
  }
}
