import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';
import { InventoryItemResponseDto } from '../dto/item/inventory-item-response.dto';
import { CreateInventoryItemDto } from '../dto/item/create-inventory-item.dto';
import { QueryInventoryItemsDto } from '../dto/item/query-inventory-items.dto';
import { UpdateInventoryItemDto } from '../dto/item/update-inventory-item.dto';
import { InventoryCategory } from '../entities/inventory-category.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { InventoryItemType } from '../enums/inventory-item-type.enum';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';

@Injectable()
export class InventoryItemsService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryCategory)
    private readonly categoryRepo: Repository<InventoryCategory>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    ownerId: string,
    query: QueryInventoryItemsDto,
  ): Promise<PaginatedResultDto<InventoryItemResponseDto>> {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.location', 'location')
      .where('item.ownerId = :ownerId', { ownerId });

    // Filtro isActive (por defecto solo activos)
    const isActive = query.isActive !== undefined ? query.isActive : true;
    qb.andWhere('item.isActive = :isActive', { isActive });

    if (query.categoryId) {
      qb.andWhere('item.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.status) {
      qb.andWhere('item.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('item.type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere(
        '(item.name ILIKE :search OR item.sku ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    const sortBy = query.sortBy ?? 'createdAt';
    qb.orderBy(`item.${sortBy}`, query.sortOrder)
      .skip(query.skip)
      .take(query.limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return new PaginatedResultDto(
      items.map((i) => InventoryItemResponseDto.fromEntity(i, false)),
      query.page,
      query.limit,
      totalItems,
    );
  }

  async findOne(
    ownerId: string,
    id: string,
  ): Promise<InventoryItemResponseDto> {
    const entity = await this.itemRepo.findOne({
      where: { id, ownerId },
      relations: ['category', 'location'],
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró el ítem de inventario con id "${id}".`,
      );
    }

    // Cargar serials solo si el tipo lo requiere
    const includeSerials = entity.type === InventoryItemType.SERIALIZED;
    if (includeSerials) {
      const withSerials = await this.itemRepo.findOne({
        where: { id, ownerId },
        relations: ['category', 'location', 'serials'],
      });
      return InventoryItemResponseDto.fromEntity(withSerials!, true);
    }

    return InventoryItemResponseDto.fromEntity(entity, false);
  }

  async create(
    ownerId: string,
    dto: CreateInventoryItemDto,
  ): Promise<InventoryItemResponseDto> {
    // Verificar categoría existe y pertenece al owner
    await this.verifyCategoryOrFail(ownerId, dto.categoryId);

    // Verificar SKU único por owner
    await this.verifySkuUnique(ownerId, dto.sku);

    const initialStock = dto.initialStock ?? 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entity = queryRunner.manager.create(InventoryItem, {
        ownerId,
        name: dto.name.trim(),
        sku: dto.sku.trim().toUpperCase(),
        type: dto.type,
        status: dto.status,
        categoryId: dto.categoryId,
        locationId: dto.locationId ?? null,
        rentPrice: dto.rentPrice != null ? String(dto.rentPrice) : null,
        salePrice: dto.salePrice != null ? String(dto.salePrice) : null,
        attributes: dto.attributes ?? {},
        stockTotal: initialStock,
        stockAvailable: initialStock,
        stockReserved: 0,
        stockRented: 0,
        isActive: true,
      });

      const saved = await queryRunner.manager.save(InventoryItem, entity);

      if (initialStock > 0) {
        const movement = queryRunner.manager.create(InventoryMovement, {
          ownerId,
          itemId: saved.id,
          type: InventoryMovementType.IN,
          quantity: initialStock,
          destinationLocationId: dto.locationId ?? null,
          reason: 'Stock inicial por creación de ítem',
          snapshotStockBefore: {
            total: 0,
            available: 0,
            reserved: 0,
            rented: 0,
          },
          snapshotStockAfter: {
            total: initialStock,
            available: initialStock,
            reserved: 0,
            rented: 0,
          },
        });
        await queryRunner.manager.save(InventoryMovement, movement);
      }

      await queryRunner.commitTransaction();
      return this.findOne(ownerId, saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemResponseDto> {
    const entity = await this.getEntityOrFail(ownerId, id);

    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.sku !== undefined && dto.sku !== entity.sku) {
      await this.verifySkuUnique(ownerId, dto.sku, id);
      entity.sku = dto.sku.trim().toUpperCase();
    }
    if (dto.type !== undefined) entity.type = dto.type;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.categoryId !== undefined) {
      await this.verifyCategoryOrFail(ownerId, dto.categoryId);
      entity.categoryId = dto.categoryId;
    }
    if (dto.locationId !== undefined) entity.locationId = dto.locationId ?? null;
    if (dto.rentPrice !== undefined)
      entity.rentPrice = dto.rentPrice != null ? String(dto.rentPrice) : null;
    if (dto.salePrice !== undefined)
      entity.salePrice = dto.salePrice != null ? String(dto.salePrice) : null;
    if (dto.attributes !== undefined) entity.attributes = dto.attributes;

    await this.itemRepo.save(entity);
    return this.findOne(ownerId, id);
  }

  /** Soft-delete: preserva historiales de notas de venta. */
  async remove(ownerId: string, id: string): Promise<InventoryItemResponseDto> {
    const entity = await this.getEntityOrFail(ownerId, id);
    entity.isActive = false;
    await this.itemRepo.save(entity);
    return InventoryItemResponseDto.fromEntity(entity, false);
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  async getEntityOrFail(ownerId: string, id: string): Promise<InventoryItem> {
    const entity = await this.itemRepo.findOne({
      where: { id, ownerId },
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró el ítem de inventario con id "${id}".`,
      );
    }
    return entity;
  }

  private async verifyCategoryOrFail(
    ownerId: string,
    categoryId: string,
  ): Promise<void> {
    const exists = await this.categoryRepo.existsBy({
      id: categoryId,
      ownerId,
      isActive: true,
    });
    if (!exists) {
      throw new NotFoundException(
        `No se encontró la categoría de inventario con id "${categoryId}".`,
      );
    }
  }

  private async verifySkuUnique(
    ownerId: string,
    sku: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .where('item.ownerId = :ownerId', { ownerId })
      .andWhere('UPPER(item.sku) = UPPER(:sku)', { sku });

    if (excludeId) {
      qb.andWhere('item.id != :excludeId', { excludeId });
    }

    const exists = await qb.getExists();
    if (exists) {
      throw new ConflictException(
        `Ya existe un ítem con el SKU "${sku.toUpperCase()}" en este negocio.`,
      );
    }
  }
}
