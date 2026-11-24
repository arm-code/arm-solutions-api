#!/usr/bin/env bash
# Backup de la base: un .sql.gz por día en ./backups, conserva los últimos 14.
# Uso:  ./scripts/backup.sh
# Cron (Debian), todos los días 3am:
#   0 3 * * * cd /ruta/arm-solutions-api && ./scripts/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p backups
FILE="backups/changarro-$(date +%Y%m%d-%H%M%S).sql.gz"

docker compose exec -T postgres pg_dump -U changarro -d changarro --no-owner --no-acl | gzip > "$FILE"

# Un backup vacío significa que algo falló: no lo conserves
if [ "$(gzip -dc "$FILE" | wc -c)" -lt 1000 ]; then
  rm -f "$FILE"; echo "ERROR: backup vacío, descartado" >&2; exit 1
fi

find backups -name 'changarro-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "OK $FILE ($(du -h "$FILE" | cut -f1))"
