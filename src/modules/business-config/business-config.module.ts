import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessConfigController } from './business-config.controller';
import { BusinessConfigService } from './business-config.service';
import { BusinessConfig } from './entities/business-config.entity';
import { PaymentCard } from './entities/payment-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessConfig, PaymentCard])],
  controllers: [BusinessConfigController],
  providers: [BusinessConfigService],
  exports: [BusinessConfigService],
})
export class BusinessConfigModule {}
