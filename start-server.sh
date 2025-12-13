#!/bin/bash

echo "🚀 Starting GeStock server..."
echo "📍 Working directory: $(pwd)"
echo "🌍 Environment: $NODE_ENV"
echo "🔐 NEXTAUTH_URL: $NEXTAUTH_URL"
echo "🗄️  DATABASE_URL: ${DATABASE_URL:0:30}..."

# Vérifier que le build standalone existe
if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ ERROR: .next/standalone/server.js not found!"
  exit 1
fi

# Vérifier les variables d'environnement critiques
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set!"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ ERROR: NEXTAUTH_SECRET not set!"
  exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
  echo "⚠️  WARNING: NEXTAUTH_URL not set, using default"
  export NEXTAUTH_URL="https://gema-l9le.onrender.com"
fi

# Copier prisma.config.ts et schema dans standalone si nécessaire
if [ -f "prisma.config.ts" ] && [ ! -f ".next/standalone/prisma.config.ts" ]; then
  echo "📋 Copying prisma.config.ts to standalone..."
  cp prisma.config.ts .next/standalone/
fi

if [ -d "prisma" ] && [ ! -d ".next/standalone/prisma" ]; then
  echo "📋 Copying prisma directory to standalone..."
  cp -r prisma .next/standalone/
fi

echo "✅ Pre-flight checks passed"
echo "🎯 Starting server on port ${PORT:-3000}..."
echo ""

# Démarrer le serveur depuis le répertoire standalone
cd .next/standalone
exec node server.js
