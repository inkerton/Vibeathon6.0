#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
    
    # Wait a moment for database to be ready
    sleep 2
    
    # Run seed
    echo "🌱 Seeding database..."
    npm run seed
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Seed failed, but continuing with server start..."
    fi
else
    echo "❌ Migration failed, aborting..."
    exit 1
fi

# Start the server
echo "🎯 Starting server..."
node dist/index.js
