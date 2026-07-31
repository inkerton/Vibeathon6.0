#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed, aborting..."
    exit 1
fi

# Start the server
echo "🎯 Starting server..."
node dist/index.js