import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessResponseDto } from './dto/business-response.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { Business } from './entities/business.entity';
import { BusinessUser } from './entities/business-user.entity';
import { BusinessRole } from './enums/business-role.enum';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessUser)
    private readonly memberRepo: Repository<BusinessUser>,
  ) {}

  /**
   * Retorna todos los negocios a los que pertenece el usuario autenticado,
   * incluyendo su rol en cada uno.
   */
  async getMyBusinesses(userId: string): Promise<BusinessResponseDto[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: ['business'],
      order: { createdAt: 'ASC' },
    });

    return memberships
      .filter((m) => m.business?.isActive)
      .map((m) => BusinessResponseDto.fromEntities(m.business, m));
  }

  /**
   * Valida que el usuario pertenezca al negocio especificado.
   *
   * @returns El rol del usuario en ese negocio.
   * @throws ForbiddenException si no pertenece o el negocio está inactivo.
   */
  async validateUserInBusiness(
    userId: string,
    businessId: string,
  ): Promise<BusinessRole> {
    const membership = await this.memberRepo.findOne({
      where: { userId, businessId },
      relations: ['business'],
    });

    if (!membership || !membership.business?.isActive) {
      this.logger.warn(
        `Usuario ${userId} intentó acceder al negocio ${businessId} sin permisos.`,
      );
      throw new ForbiddenException(
        'No tienes acceso a este negocio o el negocio no existe.',
      );
    }

    return membership.role;
  }

  /**
   * Crea un nuevo negocio y agrega al creador como `admin`.
   * También inserta los catálogos default (payment_methods, categories).
   */
  async createBusiness(
    userId: string,
    dto: CreateBusinessDto,
  ): Promise<BusinessResponseDto> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    // Verificar unicidad del slug
    const existing = await this.businessRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(
        `Ya existe un negocio con el slug "${slug}". Elige otro nombre o especifica un slug diferente.`,
      );
    }

    const business = this.businessRepo.create({
      name: dto.name.trim(),
      slug,
      logoUrl: null,
      isActive: true,
    });

    const saved = await this.businessRepo.save(business);

    // Agregar al creador como admin
    const membership = this.memberRepo.create({
      businessId: saved.id,
      userId,
      role: BusinessRole.ADMIN,
    });

    const savedMembership = await this.memberRepo.save(membership);

    this.logger.log(`Negocio creado: ${saved.name} (${saved.id}) por usuario ${userId}`);

    return BusinessResponseDto.fromEntities(saved, savedMembership);
  }

  /**
   * Obtiene los datos de un negocio por ID (sin validación de membresía).
   * Uso interno para contextos donde ya validamos membresía previamente.
   */
  async findById(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId, isActive: true },
    });

    if (!business) {
      throw new NotFoundException(`Negocio con id "${businessId}" no encontrado.`);
    }

    return business;
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /**
   * Genera un slug URL-amigable a partir del nombre del negocio.
   * Ej: "Eventos Mendoza S.A." → "eventos-mendoza-sa"
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '')   // solo alfanuméricos y espacios
      .trim()
      .replace(/\s+/g, '-')           // espacios → guiones
      .replace(/-+/g, '-')            // guiones múltiples → uno solo
      .substring(0, 100);
  }
}
