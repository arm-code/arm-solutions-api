#!/usr/bin/env bash
# Descarga las imágenes que siguen en Supabase Storage, las guarda en el volumen
# de storage del API y reescribe sus URLs en la base. Idempotente: si una imagen
# falla, no se toca su URL y puedes volver a correrlo.
#
# Requisitos: `docker compose up -d postgres api` (el API monta el volumen).
# Uso:
#   STORAGE_PUBLIC_URL=https://api.tudominio.mx/files ./scripts/migrate-storage-from-supabase.sh
# (sin la variable usa http://localhost:3500/files)
set -euo pipefail
cd "$(dirname "$0")/.."

PUBLIC_URL="${STORAGE_PUBLIC_URL:-http://localhost:3500/files}"
PUBLIC_URL="${PUBLIC_URL%/}"
MARK='/storage/v1/object/public/businesses/'
PSQL=(docker compose exec -T postgres psql -U changarro -d changarro -v ON_ERROR_STOP=1 -tA -F $'\t')

# tabla.columna que pueden contener URLs de imágenes
TARGETS=("business_configs logo_url" "business_gallery_items url" "businesses logo_url")
ok=0; fail=0

for t in "${TARGETS[@]}"; do
  read -r table col <<< "$t"
  while IFS=$'\t' read -r id url; do
    [ -n "$id" ] || continue
    rel="${url#*"$MARK"}"
    # Solo rutas simples <uuid>/<carpeta>/<archivo>: nada de .. ni caracteres raros
    if [[ ! "$rel" =~ ^[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+\.[A-Za-z0-9]+$ ]]; then
      echo "SKIP ruta inesperada en $table.$col ($id)" >&2; fail=$((fail+1)); continue
    fi
    dir="/app/storage/$(dirname "$rel")"
    if docker compose exec -T api sh -c "mkdir -p '$dir' && curl -fsSL -o '/app/storage/$rel' '$url'" < /dev/null; then
      "${PSQL[@]}" -c "update armsolutions.$table set $col = '$PUBLIC_URL/$rel' where id = '$id'" >/dev/null < /dev/null
      echo "OK   $rel"; ok=$((ok+1))
    else
      echo "FALLO $url" >&2; fail=$((fail+1))
    fi
  done < <("${PSQL[@]}" -c "select id, $col from armsolutions.$table where $col like '%$MARK%'")
done

echo "Listo: $ok migradas, $fail con problemas"
[ "$fail" -eq 0 ]
