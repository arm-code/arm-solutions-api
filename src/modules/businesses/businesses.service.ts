import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessConfigService } from '../business-config/business-config.service';
import { BusinessResponseDto } from './dto/business-response.dto';
import { PublicBusinessResponseDto } from './dto/public-business-response.dto';
import { Business } from './entities/business.entity';
import { BusinessUser } from './entities/business-user.entity';
import { BusinessRole } from './enums/business-role.enum';

/** Cuánto se recuerda el negocio en memoria antes de volver a consultarlo. */
const CURRENT_BUSINESS_TTL_MS = 60_000;

/**
 * Una instancia del sistema atiende a UN negocio. Se elige con la variable
 * `BUSINESS_SLUG`; si no está definida se usa el negocio activo más antiguo.
 */
@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);
  private current: { business: Business; at: number } | null = null;

  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(BusinessUser)
    private readonly memberRepo: Repository<BusinessUser>,
    private readonly businessConfigService: BusinessConfigService,
    private readonly configService: ConfigService,
  ) {}

  /** Negocio de esta instancia (con caché corta en memoria). */
  async getCurrentBusiness(): Promise<Business> {
    if (this.current && Date.now() - this.current.at < CURRENT_BUSINESS_TTL_MS) {
      return this.current.business;
    }

    const slug = this.configService.get<string>('BUSINESS_SLUG')?.trim();
    let business: Business | null;

    if (slug) {
      business = await this.businessRepo.findOne({ where: { slug, isActive: true } });
      if (!business) {
        throw new NotFoundException(`BUSINESS_SLUG="${slug}" no corresponde a un negocio activo.`);
      }
    } else {
      const active = await this.businessRepo.find({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
        take: 2,
      });
      business = active[0] ?? null;
      if (!business) {
        throw new NotFoundException(
          'No hay un negocio configurado. Créalo con: node dist/src/scripts/user-admin.js create-business "<nombre>" <slug>',
        );
      }
      if (active.length > 1) {
        this.logger.warn(
          `Hay varios negocios activos; se usa "${business.slug}". Define BUSINESS_SLUG para elegir uno.`,
        );
      }
    }

    this.current = { business, at: Date.now() };
    return business;
  }

  /** El negocio de la instancia, con el rol del usuario si pertenece a él. */
  async getMyBusinesses(userId: string): Promise<BusinessResponseDto[]> {
    const business = await this.getCurrentBusiness();
    const membership = await this.memberRepo.findOne({
      where: { userId, businessId: business.id },
      relations: ['business'],
    });
    return membership ? [BusinessResponseDto.fromEntities(business, membership)] : [];
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
      this.logger.warn(`Usuario ${userId} sin permisos en el negocio ${businessId}.`);
      throw new ForbiddenException('No tienes acceso a este negocio.');
    }

    return membership.role;
  }

  /** Información pública (landing) del negocio de esta instancia. */
  async getPublicBusiness(): Promise<PublicBusinessResponseDto> {
    const business = await this.getCurrentBusiness();
    const configDto = await this.businessConfigService.getConfig(business.id);
    return PublicBusinessResponseDto.create(business, configDto);
  }

  /** Datos de un negocio por ID (uso interno, sin validar membresía). */
  async findById(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId, isActive: true },
    });

    if (!business) {
      throw new NotFoundException(`Negocio con id "${businessId}" no encontrado.`);
    }

    return business;
  }
}
