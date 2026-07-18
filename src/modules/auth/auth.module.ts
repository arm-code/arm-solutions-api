import { Global, Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

/**
 * Módulo global: expone `SupabaseAuthGuard` para que cualquier módulo de
 * feature pueda usarlo con `@UseGuards(SupabaseAuthGuard)` sin necesidad de
 * volver a importarlo explícitamente.
 */
@Global()
@Module({
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
