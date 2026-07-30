#!/bin/bash
set -e

echo "🔍 Checking migration status..."

# Try to resolve any failed migrations first
npx prisma migrate resolve --applied 20260730132125_add_ai_features || true

# Now deploy migrations
echo "📦 Deploying migrations..."
npx prisma migrate deploy

echo "✅ Migration completed successfully!"
