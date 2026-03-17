#!/bin/bash
# ============================================================
# Run full migration — schema + constraints + functions + indexes + data
# ============================================================

set -e

DB_NAME="${DB_NAME:-smtrade_db}"
DB_USER="${DB_USER:-smtrade_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_DIR="$SCRIPT_DIR/../database"

export PGPASSWORD="${DB_PASSWORD:-}"

if [ -z "$PGPASSWORD" ]; then
  echo "❌ Set DB_PASSWORD environment variable"
  exit 1
fi

PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

echo "🚀 Running migration..."

echo "  1/5 → Applying schema..."
$PSQL -f "$DB_DIR/schema.sql"

echo "  2/5 → Applying constraints..."
$PSQL -f "$DB_DIR/constraints.sql"

echo "  3/5 → Applying functions & triggers..."
$PSQL -f "$DB_DIR/functions.sql"

echo "  4/5 → Applying indexes..."
$PSQL -f "$DB_DIR/indexes.sql"

echo "  5/5 → Importing data..."
if [ -f "$DB_DIR/data.sql" ]; then
  $PSQL -f "$DB_DIR/data.sql"
  echo "       ✓ Production data imported"
else
  echo "       ⚠ No data.sql found — run export_supabase_data.sh first"
  echo "       → Applying seed data instead..."
  $PSQL -f "$DB_DIR/seed.sql"
fi

echo ""
echo "🔍 Validating row counts..."
$PSQL -c "
SELECT
  tablename AS table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.table_schema = 'public') AS columns,
  (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
FROM pg_tables t,
LATERAL (SELECT query_to_xml('SELECT COUNT(*) AS cnt FROM public.' || quote_ident(t.tablename), false, false, '') AS xml_count) x
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo ""
echo "✅ Migration complete!"
