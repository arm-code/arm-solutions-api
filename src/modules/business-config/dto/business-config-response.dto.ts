import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessConfig } from '../entities/business-config.entity';
import { BusinessStat } from '../entities/business-stat.entity';
import { BusinessValue } from '../entities/business-value.entity';
import { Faq } from '../entities/faq.entity';
import { GalleryItem } from '../entities/gallery-item.entity';
import { PaymentCard } from '../entities/payment-card.entity';
import { Testimonial } from '../entities/testimonial.entity';

// ── Sub-DTOs ─────────────────────────────────────────────────────────────────

export class PaymentCardResponseDto {
  @ApiProperty({ example: 'card-001' })
  id: string;

  @ApiProperty({ example: 'BBVA' })
  bank: string;

  @ApiPropertyOptional({ example: '4152 3138 1234 5678', nullable: true })
  cardNumber: string | null;

  @ApiPropertyOptional({ example: '012180012345678901', nullable: true })
  clabe: string | null;

  @ApiProperty({ example: 'Eventos Mendoza' })
  beneficiary: string;

  static fromEntity(entity: PaymentCard): PaymentCardResponseDto {
    const dto = new PaymentCardResponseDto();
    dto.id = entity.id;
    dto.bank = entity.bank;
    dto.cardNumber = entity.cardNumber;
    dto.clabe = entity.clabe;
    dto.beneficiary = entity.beneficiary;
    return dto;
  }
}

export class GalleryItemResponseDto {
  @ApiProperty({ example: 'uuid-abc-123' })
  id: string;

  @ApiProperty({ example: 'https://cdn.supabase.co/storage/v1/object/public/businesses/abc/gallery/img.jpg' })
  url: string;

  @ApiPropertyOptional({ example: 'Mesas y sillas', nullable: true })
  label: string | null;

  @ApiPropertyOptional({ example: 'Fotografía de mesas y sillas estilo clásico', nullable: true })
  alt: string | null;

  @ApiProperty({ example: 1 })
  order: number;

  static fromEntity(entity: GalleryItem): GalleryItemResponseDto {
    const dto = new GalleryItemResponseDto();
    dto.id = entity.id;
    dto.url = entity.url;
    dto.label = entity.label;
    dto.alt = entity.alt;
    dto.order = entity.order;
    return dto;
  }
}

export class BusinessValueResponseDto {
  @ApiProperty({ example: 'uuid-abc-123' })
  id: string;

  @ApiProperty({ example: 'Responsabilidad' })
  title: string;

  @ApiPropertyOptional({ example: 'Cumplimos horarios y lo acordado en tu pedido.', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    example: 'clock',
    description: 'Nombre de ícono de lucide-react.',
    nullable: true,
  })
  icon: string | null;

  @ApiProperty({ example: 1 })
  order: number;

  static fromEntity(entity: BusinessValue): BusinessValueResponseDto {
    const dto = new BusinessValueResponseDto();
    dto.id = entity.id;
    dto.title = entity.title;
    dto.description = entity.description;
    dto.icon = entity.icon;
    dto.order = entity.order;
    return dto;
  }
}

export class BusinessStatResponseDto {
  @ApiProperty({ example: 'uuid-abc-123' })
  id: string;

  @ApiProperty({ example: '+500' })
  value: string;

  @ApiProperty({ example: 'eventos atendidos' })
  label: string;

  @ApiProperty({ example: 1 })
  order: number;

  static fromEntity(entity: BusinessStat): BusinessStatResponseDto {
    const dto = new BusinessStatResponseDto();
    dto.id = entity.id;
    dto.value = entity.value;
    dto.label = entity.label;
    dto.order = entity.order;
    return dto;
  }
}

export class TestimonialResponseDto {
  @ApiProperty({ example: 'uuid-abc-123' })
  id: string;

  @ApiProperty({ example: 'Llegaron puntual y el montaje quedó perfecto.' })
  text: string;

  @ApiProperty({ example: 'María P.' })
  author: string;

  @ApiProperty({ example: 5, description: 'Calificación del 1 al 5.' })
  rating: number;

  @ApiProperty({ example: 1 })
  order: number;

  static fromEntity(entity: Testimonial): TestimonialResponseDto {
    const dto = new TestimonialResponseDto();
    dto.id = entity.id;
    dto.text = entity.text;
    dto.author = entity.author;
    dto.rating = entity.rating;
    dto.order = entity.order;
    return dto;
  }
}

export class FaqResponseDto {
  @ApiProperty({ example: 'uuid-abc-123' })
  id: string;

  @ApiProperty({ example: '¿Con cuánto tiempo debo reservar?' })
  question: string;

  @ApiProperty({ example: 'Para fines de semana, sugerimos 1–2 semanas antes.' })
  answer: string;

  @ApiProperty({ example: 1 })
  order: number;

  static fromEntity(entity: Faq): FaqResponseDto {
    const dto = new FaqResponseDto();
    dto.id = entity.id;
    dto.question = entity.question;
    dto.answer = entity.answer;
    dto.order = entity.order;
    return dto;
  }
}

// ── Principal ─────────────────────────────────────────────────────────────────

export class BusinessConfigResponseDto {
  @ApiProperty({ example: 'cfg-123456' })
  id: string;

  @ApiProperty({ example: 'Eventos Mendoza' })
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.supabase.co/storage/v1/object/public/businesses/abc/logo/uuid.png', nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ example: '656 123 4567', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: '526561234567', nullable: true })
  whatsapp: string | null;

  @ApiPropertyOptional({ example: 'contacto@eventosmendoza.com', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: 'Av. Principal #123, Cd. Juárez', nullable: true })
  address: string | null;

  @ApiProperty({ example: ['Sillas y mesas', 'Carpas', 'Mantelería', 'Montaje'] })
  services: string[];

  @ApiProperty({ example: ['Ciudad Juárez', 'Chihuahua'] })
  coverageAreas: string[];

  @ApiPropertyOptional({
    example: 'El cliente se compromete a entregar el mobiliario en buen estado.',
    nullable: true,
  })
  termsAndConditions: string | null;

  @ApiPropertyOptional({ example: 'Renta de mobiliario de alta calidad para tus mejores eventos.', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 'Fundada en 2018 con la misión de transformar tus eventos.', nullable: true })
  history: string | null;

  @ApiPropertyOptional({ example: 'Brindar el mejor servicio de logística y mobiliario.', nullable: true })
  mission: string | null;

  @ApiPropertyOptional({ example: 'Ser la empresa líder en banquetes y eventos en la región.', nullable: true })
  vision: string | null;

  @ApiPropertyOptional({ example: 'Lunes a Domingo 08:00 - 21:00', nullable: true })
  openingHours: string | null;

  @ApiPropertyOptional({
    example: 'Hola, quiero cotizar renta de mobiliario para mi evento',
    description: 'Mensaje pre-rellenado para el botón de WhatsApp. Si es null, el frontend usa un fallback.',
    nullable: true,
  })
  whatsappMessage: string | null;

  @ApiProperty({ type: [PaymentCardResponseDto] })
  paymentCards: PaymentCardResponseDto[];

  @ApiProperty({
    type: [GalleryItemResponseDto],
    description: 'Imágenes del catálogo. Ordenadas por `order` ASC.',
  })
  gallery: GalleryItemResponseDto[];

  @ApiProperty({
    type: [BusinessValueResponseDto],
    description: 'Valores corporativos. Ordenados por `order` ASC.',
  })
  values: BusinessValueResponseDto[];

  @ApiProperty({
    type: [BusinessStatResponseDto],
    description: 'Métricas "En números". Ordenadas por `order` ASC.',
  })
  stats: BusinessStatResponseDto[];

  @ApiProperty({
    type: [TestimonialResponseDto],
    description: 'Testimonios de clientes. Ordenados por `order` ASC.',
  })
  testimonials: TestimonialResponseDto[];

  @ApiProperty({
    type: [FaqResponseDto],
    description: 'Preguntas frecuentes. Ordenadas por `order` ASC.',
  })
  faqs: FaqResponseDto[];

  @ApiProperty({ example: '2026-07-23T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-23T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: BusinessConfig): BusinessConfigResponseDto {
    const sortByOrder = <T extends { order: number }>(arr: T[]): T[] =>
      [...arr].sort((a, b) => a.order - b.order);

    const dto = new BusinessConfigResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.logoUrl = entity.logoUrl;
    dto.phone = entity.phone;
    dto.whatsapp = entity.whatsapp;
    dto.email = entity.email;
    dto.address = entity.address;
    dto.services = entity.services || [];
    dto.coverageAreas = entity.coverageAreas || [];
    dto.termsAndConditions = entity.termsAndConditions;
    dto.description = entity.description;
    dto.history = entity.history;
    dto.mission = entity.mission;
    dto.vision = entity.vision;
    dto.openingHours = entity.openingHours;
    dto.whatsappMessage = entity.whatsappMessage ?? null;
    dto.paymentCards = (entity.paymentCards || []).map((card) =>
      PaymentCardResponseDto.fromEntity(card),
    );
    dto.gallery = sortByOrder(entity.gallery || []).map((item) =>
      GalleryItemResponseDto.fromEntity(item),
    );
    dto.values = sortByOrder(entity.values || []).map((v) =>
      BusinessValueResponseDto.fromEntity(v),
    );
    dto.stats = sortByOrder(entity.stats || []).map((s) =>
      BusinessStatResponseDto.fromEntity(s),
    );
    dto.testimonials = sortByOrder(entity.testimonials || []).map((t) =>
      TestimonialResponseDto.fromEntity(t),
    );
    dto.faqs = sortByOrder(entity.faqs || []).map((f) =>
      FaqResponseDto.fromEntity(f),
    );
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
