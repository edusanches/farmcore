#!/bin/sh
set -e

echo "FarmCore - Starting..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "Warning: Migrations may need manual attention"

echo "Starting server..."
exec "$@"
