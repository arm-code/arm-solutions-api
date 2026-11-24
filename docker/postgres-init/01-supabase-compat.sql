-- Compatibilidad mínima con Supabase para correr las migraciones actuales
-- sobre un Postgres normal.
--
-- Las migraciones referencian `auth.users` (FK) y `auth.uid()` / `auth.role()`
-- (políticas RLS). Este script crea solo lo necesario para que existan.
--
-- TEMPORAL: en la Fase 3 (auth propia) `auth.users` se reemplaza por una tabla
-- de usuarios nuestra y este archivo se elimina.
--
-- Solo corre la PRIMERA vez que se crea el volumen de Postgres.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id    uuid PRIMARY KEY,
  email text
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '')
$$;

-- TypeORM guarda su tabla de migraciones en este schema y la necesita ANTES
-- de la primera migración (en Supabase ya existía).
CREATE SCHEMA IF NOT EXISTS armsolutions;

-- Roles que Supabase trae por defecto y que referencian algunas políticas RLS
-- (p. ej. contact_messages). Sin login: solo existen para que el SQL cargue.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
