import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessConfigModule } from '../business-config/business-config.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { Business } from './entities/business.entity';
import { BusinessUser } from './entities/business-user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Business, BusinessUser]),
    BusinessConfigModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService], // Exportado para inyección en TenantGuard
})
export class BusinessesModule {}
