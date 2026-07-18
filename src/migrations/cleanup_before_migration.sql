-- ============================================================
-- LIMPIEZA PREVIA A LA MIGRACIÓN
-- Ejecutar en Supabase > SQL Editor antes de correr migration:run
-- ============================================================

-- 1. Eliminar tablas con datos (si las hay, se pierden)
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "business_events" CASCADE;
DROP TABLE IF EXISTS "transaction_categories" CASCADE;
DROP TABLE IF EXISTS "payment_methods" CASCADE;

-- 2. Eliminar enum
DROP TYPE IF EXISTS "transactions_type_enum" CASCADE;

-- 3. Eliminar secuencia
DROP SEQUENCE IF EXISTS "transactions_folio_seq";

-- 4. Limpiar registro de migraciones de TypeORM (si existe)
DELETE FROM "migrations" WHERE name = 'CreateFinanceSchema1752710400000';
