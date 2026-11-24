import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from '../businesses/businesses.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';

/**
 * Módulo global: expone `JwtAuthGuard` y `TenantGuard` para que cualquier
 * módulo de feature los use sin importarlos. `BusinessesModule` se importa
 * aquí para que `TenantGuard` pueda inyectar `BusinessesService`.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User]), BusinessesModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, TenantGuard],
  exports: [JwtAuthGuard, TenantGuard],
})
export class AuthModule {}
