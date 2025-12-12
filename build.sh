#!/bin/bash
set -e

echo "🔧 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma Client
echo "🗄️  Generating Prisma Client..."
npx prisma generate

# Run database migrations (only on Render/production)
if [ ! -z "$RENDER" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
else
  echo "⏭️  Skipping migrations (local build)"
fi

# Build Next.js app
echo "🏗️  Building Next.js app..."
npm run build

# Copy static files to standalone directory
echo "📋 Copying static files..."
if [ -d ".next/static" ]; then
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/
  echo "✅ Static files copied"
else
  echo "❌ .next/static directory not found"
  exit 1
fi

# Copy public files to standalone directory
echo "📋 Copying public files..."
if [ -d "public" ]; then
  mkdir -p .next/standalone/public
  cp -r public/* .next/standalone/public/ 2>/dev/null || echo "⚠️  Public directory is empty"
  echo "✅ Public files copied"
else
  echo "⚠️  No public directory found"
fi

echo "✨ Build completed successfully!"
