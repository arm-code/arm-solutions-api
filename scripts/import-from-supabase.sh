#!/usr/bin/env bash
# Migra los datos de Supabase al Postgres local (Fase 1).
#
#   1) ./scripts/import-from-supabase.sh export   # lee Supabase, escribe ./import/
#   2) ./scripts/import-from-supabase.sh restore  # carga ./import/ al Postgres local
#
# Requisitos: Postgres local arriba (docker compose up -d postgres) y VACÍO
# (volumen nuevo: sin correr migraciones). El dump trae su propio esquema y la
# tabla de migraciones, así que NO hay que correr `migrate` después.
#
# Para `export`: SUPABASE_DB_URL con la cadena de conexión directa de Supabase
#   (Project Settings > Database > Connection string > URI), p. ej.:
#   export SUPABASE_DB_URL='postgresql://postgres:***@db.xxxx.supabase.co:5432/postgres'
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p import

case "${1:-}" in
  export)
    : "${SUPABASE_DB_URL:?Define SUPABASE_DB_URL}"
    # Cliente 17 para poder leer cualquier versión de servidor de Supabase
    docker run --rm postgres:17-alpine pg_dump "$SUPABASE_DB_URL" \
      --schema=armsolutions --no-owner --no-acl > import/armsolutions.sql
    # Solo id y email de los usuarios: lo que referencia nuestra FK
    docker run --rm postgres:17-alpine psql "$SUPABASE_DB_URL" \
      -c "\copy (select id, email from auth.users) to stdout with csv" > import/auth_users.csv
    echo "OK: $(wc -l < import/auth_users.csv) usuarios, dump en import/armsolutions.sql"
    ;;
  restore)
    [ -s import/armsolutions.sql ] || { echo "Falta import/armsolutions.sql" >&2; exit 1; }
    PSQL=(docker compose exec -T postgres psql -U changarro -d changarro -v ON_ERROR_STOP=1)

    # Seguridad: no pisar una base que ya tiene tablas
    N=$("${PSQL[@]}" -tA -c "select count(*) from information_schema.tables where table_schema='armsolutions'")
    [ "$N" = "0" ] || { echo "armsolutions ya tiene $N tablas; usa un volumen nuevo" >&2; exit 1; }

    # 1) usuarios primero (las FK de business_users apuntan a auth.users)
    if [ -s import/auth_users.csv ]; then
      "${PSQL[@]}" -c "\copy auth.users (id, email) from stdin with csv" < import/auth_users.csv
    fi
    # 2) esquema + datos (el schema ya existe por el init de compose)
    grep -v '^CREATE SCHEMA armsolutions;' import/armsolutions.sql | "${PSQL[@]}" -q
    echo "OK: tablas cargadas: $("${PSQL[@]}" -tA -c "select count(*) from information_schema.tables where table_schema='armsolutions'")"
    ;;
  *) echo "Uso: $0 export|restore" >&2; exit 1 ;;
esac
