import { Global, Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { TenantGuard } from './guards/tenant.guard';

/**
 * Módulo global: expone `SupabaseAuthGuard` y `TenantGuard` para que
 * cualquier módulo de feature pueda usarlos sin importarlos explícitamente.
 *
 * `BusinessesModule` se importa aquí para que `TenantGuard` pueda
 * inyectar `BusinessesService` sin dependencias circulares.
 */
@Global()
@Module({
  imports: [BusinessesModule],
  providers: [SupabaseAuthGuard, TenantGuard],
  exports: [SupabaseAuthGuard, TenantGuard],
})
export class AuthModule {}

