#!/bin/bash

# Test Database Setup Script
# Run this to initialize your test database

set -e

echo "🧪 Setting up test database for Scholarship Hunter..."
echo ""

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo "❌ .env.test not found!"
    echo "Please copy .env.test.example to .env.test and configure it."
    exit 1
fi

echo "✅ Found .env.test"

# Load test environment
export $(cat .env.test | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.test"
    exit 1
fi

echo "📊 Database URL configured"
echo ""

# Run Prisma migrations
echo "🔄 Applying Prisma schema to test database..."
pnpm prisma db push --skip-generate

echo ""
echo "✅ Test database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env.test with your Clerk test keys"
echo "  2. Run: pnpm test:e2e tests/e2e/examples/refactored-auth.spec.ts"
echo ""
