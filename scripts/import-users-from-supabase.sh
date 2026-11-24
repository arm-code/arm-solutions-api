#!/usr/bin/env bash
# Trae de Supabase los hashes de contraseña (bcrypt) para que los usuarios
# puedan entrar con la MISMA contraseña de siempre. Los hashes no se imprimen
# ni se guardan en git: solo viajan por el archivo temporal import/users_hashes.csv.
#
# Requisitos: migración CreateUsersTable aplicada (docker compose run --rm migrate)
# y SUPABASE_DB_URL definido (mismo Session pooler que usaste en el export).
#   export SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres'
#   ./scripts/import-users-from-supabase.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Define SUPABASE_DB_URL}"
mkdir -p import

docker run --rm postgres:17-alpine psql "$SUPABASE_DB_URL" \
  -c "\copy (select id, lower(email), encrypted_password from auth.users where encrypted_password is not null and email is not null) to stdout with csv" \
  > import/users_hashes.csv

PSQL=(docker compose exec -T postgres psql -U changarro -d changarro -v ON_ERROR_STOP=1)

{
  echo "create temp table tmp_hashes (id uuid, email text, hash text);"
  echo "\\copy tmp_hashes from stdin with csv"
  cat import/users_hashes.csv
  echo "\\."
  echo "update armsolutions.users u set password_hash = t.hash, updated_at = now()"
  echo "  from tmp_hashes t where u.id = t.id and t.hash like '\$2%';"
  echo "select count(*) as con_contrasena from armsolutions.users where password_hash is not null;"
} | "${PSQL[@]}" -q

rm -f import/users_hashes.csv
echo "OK: hashes importados (archivo temporal borrado)"
