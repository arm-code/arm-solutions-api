import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryLocationResponseDto } from '../dto/location/inventory-location-response.dto';
import { CreateInventoryLocationDto } from '../dto/location/create-inventory-location.dto';
import { UpdateInventoryLocationDto } from '../dto/location/update-inventory-location.dto';
import { InventoryLocation } from '../entities/inventory-location.entity';

@Injectable()
export class InventoryLocationsService {
  constructor(
    @InjectRepository(InventoryLocation)
    private readonly locationRepo: Repository<InventoryLocation>,
  ) {}

  async findAll(ownerId: string): Promise<InventoryLocationResponseDto[]> {
    const locs = await this.locationRepo.find({
      where: { ownerId, isActive: true },
      order: { name: 'ASC' },
    });
    return locs.map(InventoryLocationResponseDto.fromEntity);
  }

  async create(
    ownerId: string,
    dto: CreateInventoryLocationDto,
  ): Promise<InventoryLocationResponseDto> {
    const entity = this.locationRepo.create({
      ownerId,
      name: dto.name.trim(),
      type: dto.type,
      isActive: true,
    });
    const saved = await this.locationRepo.save(entity);
    return InventoryLocationResponseDto.fromEntity(saved);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateInventoryLocationDto,
  ): Promise<InventoryLocationResponseDto> {
    const entity = await this.getEntityOrFail(ownerId, id);
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.type !== undefined) entity.type = dto.type;
    const saved = await this.locationRepo.save(entity);
    return InventoryLocationResponseDto.fromEntity(saved);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const entity = await this.getEntityOrFail(ownerId, id);
    entity.isActive = false;
    await this.locationRepo.save(entity);
  }

  private async getEntityOrFail(
    ownerId: string,
    id: string,
  ): Promise<InventoryLocation> {
    const entity = await this.locationRepo.findOne({
      where: { id, ownerId, isActive: true },
    });
    if (!entity) {
      throw new NotFoundException(
        `No se encontró la ubicación con id "${id}".`,
      );
    }
    return entity;
  }
}
