#!/usr/bin/env bash
# Daily PostgreSQL backup for efruze. Dumps the DB from the running container,
# gzips it, and prunes backups older than 14 days. Wire into cron:
#   0 3 * * * /root/projects/efruze/scripts/backup-db.sh >> /var/log/efruze-backup.log 2>&1
set -euo pipefail

BACKUP_DIR=/root/backups/efruze
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/efruze-$STAMP.sql.gz"

echo "[$(date)] starting backup → $OUT"
docker exec efruze_postgres pg_dump -U efruze -d efruze | gzip > "$OUT"
SIZE=$(du -h "$OUT" | cut -f1)
echo "[$(date)] done — $SIZE"

# Retain 14 days.
find "$BACKUP_DIR" -name 'efruze-*.sql.gz' -mtime +14 -delete
echo "[$(date)] pruned backups older than 14 days"
