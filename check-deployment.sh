#!/bin/bash

# Script de vérification pre-déploiement Render.com
# Usage: ./check-deployment.sh

set -e

echo "🔍 Vérification pre-déploiement GEMA..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction check
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
  fi
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Vérifier Node version
echo "1️⃣  Vérification environnement..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
  check "Node version: v$(node -v)"
else
  echo -e "${RED}✗${NC} Node version trop ancienne: v$(node -v) (requis: v20+)"
  ERRORS=$((ERRORS + 1))
fi

# 2. Vérifier .nvmrc
if [ -f ".nvmrc" ]; then
  NVMRC_VERSION=$(cat .nvmrc)
  if [ "$NVMRC_VERSION" = "20" ]; then
    check ".nvmrc présent avec Node 20"
  else
    warn ".nvmrc existe mais version: $NVMRC_VERSION (devrait être 20)"
  fi
else
  echo -e "${RED}✗${NC} .nvmrc manquant"
  ERRORS=$((ERRORS + 1))
fi

# 3. Vérifier next.config.ts
echo ""
echo "2️⃣  Vérification configuration Next.js..."
if grep -q "output: 'standalone'" next.config.ts; then
  check "Configuration standalone activée"
else
  echo -e "${RED}✗${NC} output: 'standalone' manquant dans next.config.ts"
  ERRORS=$((ERRORS + 1))
fi

# 4. Vérifier Prisma
echo ""
echo "3️⃣  Vérification Prisma..."
if [ -f "prisma/schema.prisma" ]; then
  check "Schema Prisma présent"
else
  echo -e "${RED}✗${NC} prisma/schema.prisma manquant"
  ERRORS=$((ERRORS + 1))
fi

if [ -d "prisma/migrations" ]; then
  MIGRATION_COUNT=$(ls -1 prisma/migrations | wc -l)
  check "Migrations Prisma: $MIGRATION_COUNT fichiers"
else
  warn "Aucune migration Prisma trouvée"
fi

# 5. Vérifier singleton Prisma
echo ""
echo "4️⃣  Vérification singleton Prisma..."
PRISMA_INSTANCES=$(grep -r "new PrismaClient()" app/ lib/ 2>/dev/null | grep -v "lib/prisma.ts" | wc -l | xargs)
if [ "$PRISMA_INSTANCES" -eq 0 ]; then
  check "Aucune instance PrismaClient hors singleton"
else
  echo -e "${RED}✗${NC} $PRISMA_INSTANCES instance(s) PrismaClient trouvée(s) hors singleton"
  grep -rn "new PrismaClient()" app/ lib/ 2>/dev/null | grep -v "lib/prisma.ts"
  ERRORS=$((ERRORS + 1))
fi

# 6. Vérifier package.json scripts
echo ""
echo "5️⃣  Vérification scripts package.json..."
if grep -q '"build"' package.json; then
  check "Script build présent"
else
  echo -e "${RED}✗${NC} Script build manquant"
  ERRORS=$((ERRORS + 1))
fi

if grep -q '"start"' package.json; then
  check "Script start présent"
else
  echo -e "${RED}✗${NC} Script start manquant"
  ERRORS=$((ERRORS + 1))
fi

# 7. Test compilation
echo ""
echo "6️⃣  Test compilation..."
echo "   (peut prendre 15-30 secondes...)"
if npm run build > /tmp/gema-build.log 2>&1; then
  check "Build réussit sans erreurs"
else
  echo -e "${RED}✗${NC} Build échoue"
  echo "   Voir logs: tail /tmp/gema-build.log"
  ERRORS=$((ERRORS + 1))
fi

# 8. Vérifier variables env (exemple)
echo ""
echo "7️⃣  Vérification variables environnement à configurer sur Render..."
echo "   Les variables suivantes devront être configurées:"
echo "   • DATABASE_URL"
echo "   • NEXTAUTH_SECRET"
echo "   • NEXTAUTH_URL"
echo "   • NODE_ENV=production"
if [ -f ".env" ] || [ -f ".env.local" ]; then
  warn "Fichiers .env détectés - NE PAS les commit sur GitHub"
fi

# 9. Vérifier Git
echo ""
echo "8️⃣  Vérification Git..."
if [ -d ".git" ]; then
  check "Repository Git initialisé"
  
  # Vérifier branch
  BRANCH=$(git branch --show-current)
  if [ ! -z "$BRANCH" ]; then
    check "Branch active: $BRANCH"
  fi
  
  # Vérifier uncommitted changes
  if git diff-index --quiet HEAD --; then
    check "Aucun changement non commité"
  else
    warn "Changements non commités détectés"
    echo "   Exécuter: git add . && git commit -m 'Ready for Render'"
  fi
  
  # Vérifier remote
  if git remote -v | grep -q "origin"; then
    REMOTE=$(git remote get-url origin)
    check "Remote configuré: $REMOTE"
  else
    warn "Aucun remote Git configuré"
    echo "   Exécuter: git remote add origin <URL>"
  fi
else
  echo -e "${RED}✗${NC} Pas de repository Git"
  ERRORS=$((ERRORS + 1))
fi

# 10. Vérifier fichiers sensibles
echo ""
echo "9️⃣  Vérification sécurité..."
if [ -f ".gitignore" ]; then
  if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
    check ".gitignore correctement configuré"
  else
    warn ".gitignore pourrait être amélioré"
  fi
else
  warn ".gitignore manquant"
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ PRÊT POUR DÉPLOIEMENT RENDER.COM${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Push vers GitHub: git push origin main"
  echo "2. Créer PostgreSQL DB sur Render.com"
  echo "3. Créer Web Service lié au repo GitHub"
  echo "4. Configurer variables environnement"
  echo "5. Déclencher déploiement"
  echo ""
  echo "📚 Voir: RENDER_DEPLOYMENT_GUIDE.md"
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  PRÊT AVEC AVERTISSEMENTS (${WARNINGS})${NC}"
  echo ""
  echo "Le déploiement devrait fonctionner mais vérifiez les warnings ci-dessus."
else
  echo -e "${RED}❌ NON PRÊT POUR DÉPLOIEMENT (${ERRORS} erreurs, ${WARNINGS} warnings)${NC}"
  echo ""
  echo "Corrigez les erreurs ci-dessus avant de déployer."
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
