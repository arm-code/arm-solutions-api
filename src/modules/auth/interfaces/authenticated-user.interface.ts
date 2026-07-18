/**
 * Subconjunto de claims del JWT de Supabase Auth que la API necesita.
 * Referencia: https://supabase.com/docs/guides/auth/jwts
 */
export interface SupabaseJwtPayload {
  /** UUID del usuario (auth.users.id). */
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp: number;
  iat: number;
  /** Metadata de la app (custom claims), definida por el proyecto. */
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

/**
 * Forma final que se adjunta a `request.user` y que consumen los
 * controladores a través de `@CurrentUser()`.
 */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string;
}
