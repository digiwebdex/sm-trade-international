#!/bin/bash
# ============================================================
# Setup PostgreSQL database on VPS
# Run as root or with sudo
# ============================================================

set -e

DB_NAME="${DB_NAME:-smtrade_db}"
DB_USER="${DB_USER:-smtrade_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Set DB_PASSWORD environment variable"
  echo "   Usage: DB_PASSWORD=your_secure_password ./setup_database.sh"
  exit 1
fi

echo "🔧 Setting up PostgreSQL..."

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
  echo "  → Installing PostgreSQL..."
  apt-get update -qq
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

echo "  → Creating database and user..."

sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

# Grant schema privileges
sudo -u postgres psql -d "$DB_NAME" <<EOF
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOF

echo "✅ Database '${DB_NAME}' ready with user '${DB_USER}'"
