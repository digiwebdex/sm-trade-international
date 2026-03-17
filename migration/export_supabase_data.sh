#!/bin/bash
# ============================================================
# Export data from Supabase to SQL files
# Run this BEFORE migration to capture all production data
# ============================================================

set -e

# Supabase connection string — get from Lovable Cloud settings
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Set SUPABASE_DB_URL environment variable first"
  echo "   Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
  exit 1
fi

OUTPUT_DIR="$(dirname "$0")/../database"
mkdir -p "$OUTPUT_DIR"

echo "📦 Exporting Supabase database..."

# Export schema (structure only, public schema)
echo "  → Exporting schema..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-comments \
  > "$OUTPUT_DIR/supabase_schema_export.sql"

# Export data only
echo "  → Exporting data..."
pg_dump "$SUPABASE_DB_URL" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-privileges \
  --inserts \
  --column-inserts \
  > "$OUTPUT_DIR/data.sql"

# Export row counts for validation
echo "  → Counting rows..."
psql "$SUPABASE_DB_URL" -c "
SELECT
  schemaname || '.' || relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
" > "$OUTPUT_DIR/row_counts_source.txt"

echo ""
echo "✅ Export complete!"
echo "   Schema: $OUTPUT_DIR/supabase_schema_export.sql"
echo "   Data:   $OUTPUT_DIR/data.sql"
echo "   Counts: $OUTPUT_DIR/row_counts_source.txt"
echo ""
echo "Next step: Run migration/run_migration.sh on the VPS"
