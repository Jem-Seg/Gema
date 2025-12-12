#!/bin/bash
# Diagnostic script pour vérifier la structure standalone

echo "=========================================="
echo "🔍 Diagnostic Next.js Standalone"
echo "=========================================="

echo ""
echo "📁 Structure du répertoire .next/standalone:"
ls -la .next/standalone/ 2>/dev/null || echo "❌ .next/standalone n'existe pas"

echo ""
echo "📁 Contenu de .next/standalone/.next:"
ls -la .next/standalone/.next/ 2>/dev/null || echo "❌ .next/standalone/.next n'existe pas"

echo ""
echo "📁 Fichiers dans .next/standalone/.next/static:"
ls -la .next/standalone/.next/static/ 2>/dev/null || echo "❌ .next/standalone/.next/static n'existe pas"

echo ""
echo "📊 Nombre de chunks JS:"
find .next/standalone/.next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "❌ Aucun chunk trouvé"

echo ""
echo "📊 Nombre de fichiers CSS:"
find .next/standalone/.next/static/css -name "*.css" 2>/dev/null | wc -l || echo "❌ Aucun CSS trouvé"

echo ""
echo "📝 BUILD_ID standalone:"
cat .next/standalone/.next/BUILD_ID 2>/dev/null || echo "❌ BUILD_ID non trouvé"

echo ""
echo "📝 BUILD_ID principal:"
cat .next/BUILD_ID 2>/dev/null || echo "❌ BUILD_ID non trouvé"

echo ""
echo "=========================================="
