import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { BusinessConfigController } from './business-config.controller';
import { BusinessConfigService } from './business-config.service';
import { BusinessConfig } from './entities/business-config.entity';
import { BusinessStat } from './entities/business-stat.entity';
import { BusinessValue } from './entities/business-value.entity';
import { Faq } from './entities/faq.entity';
import { GalleryItem } from './entities/gallery-item.entity';
import { PaymentCard } from './entities/payment-card.entity';
import { Testimonial } from './entities/testimonial.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessConfig,
      PaymentCard,
      GalleryItem,
      BusinessValue,
      BusinessStat,
      Testimonial,
      Faq,
    ]),
  ],
  controllers: [BusinessConfigController],
  providers: [BusinessConfigService, SupabaseStorageService],
  exports: [BusinessConfigService],
})
export class BusinessConfigModule {}
