import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryCategoryResponseDto } from '../dto/category/inventory-category-response.dto';
import { CreateInventoryCategoryDto } from '../dto/category/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from '../dto/category/update-inventory-category.dto';
import { InventoryCategory } from '../entities/inventory-category.entity';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryCategoriesService {
  constructor(
    @InjectRepository(InventoryCategory)
    private readonly categoryRepo: Repository<InventoryCategory>,
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
  ) {}

  async findAll(ownerId: string): Promise<InventoryCategoryResponseDto[]> {
    const cats = await this.categoryRepo.find({
      where: { ownerId, isActive: true },
      order: { name: 'ASC' },
    });
    return cats.map(InventoryCategoryResponseDto.fromEntity);
  }

  async create(
    ownerId: string,
    dto: CreateInventoryCategoryDto,
  ): Promise<InventoryCategoryResponseDto> {
    const entity = this.categoryRepo.create({
      ownerId,
      name: dto.name.trim(),
      color: dto.color ?? '#6b7280',
      attributes: dto.attributes ?? [],
      isActive: true,
    });
    const saved = await this.categoryRepo.save(entity);
    return InventoryCategoryResponseDto.fromEntity(saved);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateInventoryCategoryDto,
  ): Promise<InventoryCategoryResponseDto> {
    const entity = await this.getEntityOrFail(ownerId, id);
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.color !== undefined) entity.color = dto.color;
    if (dto.attributes !== undefined) entity.attributes = dto.attributes;
    const saved = await this.categoryRepo.save(entity);
    return InventoryCategoryResponseDto.fromEntity(saved);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const entity = await this.getEntityOrFail(ownerId, id);

    // Regla de negocio: no borrar si tiene ítems activos asociados
    const activeItemsCount = await this.itemRepo.count({
      where: { ownerId, categoryId: id, isActive: true },
    });
    if (activeItemsCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría "${entity.name}" porque tiene ${activeItemsCount} ítem(s) activo(s) asociado(s).`,
      );
    }

    // Soft-delete de la categoría
    entity.isActive = false;
    await this.categoryRepo.save(entity);
  }

  private async getEntityOrFail(
    ownerId: string,
    id: string,
  ): Promise<InventoryCategory> {
    const entity = await this.categoryRepo.findOne({
      where: { id, ownerId, isActive: true },
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró la categoría de inventario con id "${id}".`,
      );
    }
    return entity;
  }
}
