#!/bin/bash
# ============================================================
# Seed initial data (admin user + default settings)
# ============================================================

set -e

DB_NAME="${DB_NAME:-smtrade_db}"
DB_USER="${DB_USER:-smtrade_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@smtradeint.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-changeme123}"

export PGPASSWORD="${DB_PASSWORD:-}"

if [ -z "$PGPASSWORD" ]; then
  echo "❌ Set DB_PASSWORD environment variable"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

echo "🌱 Seeding database..."

# Generate bcrypt hash using Node.js
HASH=$(node -e "const bcrypt = require('$BACKEND_DIR/node_modules/bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 10))")

PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

$PSQL <<EOF
-- Admin user
INSERT INTO users (email, password_hash) VALUES
  ('${ADMIN_EMAIL}', '${HASH}')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Default settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('contact', '{"phone": "+88 01867666888", "email": "smtrade.int94@gmail.com", "address": "Dhaka, Bangladesh", "whatsapp_number": "8801867666888"}'::jsonb),
  ('branding', '{"company_name": {"en": "S. M. Trade International", "bn": "এস. এম. ট্রেড ইন্টারন্যাশনাল"}, "tagline": {"en": "Premium Corporate Gifts & Promotional Products", "bn": "প্রিমিয়াম কর্পোরেট গিফট ও প্রমোশনাল পণ্য"}}'::jsonb),
  ('social', '{"facebook": "", "linkedin": "", "instagram": ""}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
EOF

echo "✅ Seeded admin user: ${ADMIN_EMAIL}"
echo "⚠️  CHANGE THE PASSWORD IMMEDIATELY after first login!"
