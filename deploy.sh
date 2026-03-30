#!/bin/bash
set -e

echo "🚀 Deploying SM Trade International..."

cd /var/www/sm-trade-international

# Preserve backend .env before reset
if [ -f backend/.env ]; then
  cp backend/.env /tmp/smtrade-backend-env.bak
  echo "💾 Backend .env backed up"
fi

# Preserve uploaded files before reset (git reset removes untracked uploads)
if [ -d backend/uploads ]; then
  rm -rf /tmp/smtrade-backend-uploads.bak
  cp -a backend/uploads /tmp/smtrade-backend-uploads.bak
  echo "💾 Backend uploads backed up"
fi

echo "📥 Fetching latest code..."
git fetch origin

echo "🔄 Resetting to latest main..."
git reset --hard origin/main

# Restore backend .env after reset
if [ -f /tmp/smtrade-backend-env.bak ]; then
  cp /tmp/smtrade-backend-env.bak backend/.env
  echo "✅ Backend .env restored"
fi

# Restore uploads after reset
if [ -d /tmp/smtrade-backend-uploads.bak ]; then
  rm -rf backend/uploads
  cp -a /tmp/smtrade-backend-uploads.bak backend/uploads
  echo "✅ Backend uploads restored"
fi

echo "🔨 Building frontend..."
npm run build

echo "♻️ Restarting backend..."
pm2 restart sm-trade-backend --update-env

echo "✅ Deploy complete!"
