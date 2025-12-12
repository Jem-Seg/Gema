# 🚀 Guide de déploiement Render.com - Next.js 16 + Prisma + PostgreSQL

## Étape 1: Préparation du dépôt

### 1.1 Créer `.nvmrc` pour Node 20
```bash
echo "20" > .nvmrc
```

### 1.2 Vérifier fichiers essentiels
```bash
# Vérifier que ces fichiers existent:
- package.json ✓
- next.config.ts ✓
- prisma/schema.prisma ✓
- .nvmrc ✓
```

### 1.3 Push vers GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

---

## Étape 2: Créer base de données PostgreSQL

### 2.1 Accéder à Render Dashboard
1. Aller sur https://render.com
2. Se connecter ou créer un compte
3. Cliquer sur **"New +"** → **"PostgreSQL"**

### 2.2 Configuration PostgreSQL
```
Name: gema-db
Database: gema
User: gema_user
Region: Oregon (US West) ou plus proche de vos utilisateurs
PostgreSQL Version: 16
Instance Type: Free (pour test) ou Starter ($7/mois)
```

### 2.3 Récupérer DATABASE_URL
Une fois créée, aller dans:
- **"Info"** tab
- Copier **"Internal Database URL"** (commence par `postgresql://`)
- Format: `postgresql://user:password@dpg-xxx.oregon-postgres.render.com/dbname`

---

## Étape 3: Créer Web Service

### 3.1 Nouveau service
1. Dashboard Render → **"New +"** → **"Web Service"**
2. **Connecter repository GitHub**: Autoriser accès à votre dépôt `gema`
3. Sélectionner le dépôt

### 3.2 Configuration service

#### Paramètres de base
```
Name: gema-app
Region: Oregon (US West) - MÊME RÉGION que la DB
Branch: main
Runtime: Node
```

#### Build & Deploy Settings
```
Build Command:
npm install && npx prisma generate && npx prisma migrate deploy && npm run build

Start Command:
npm run start
```

**Important**: `prisma migrate deploy` applique automatiquement les migrations en production.

#### Instance Type
```
Free (512 MB RAM) - Pour test uniquement
Starter ($7/mois, 512 MB RAM) - Minimum recommandé production
Standard ($25/mois, 2 GB RAM) - Production avec trafic
```

---

## Étape 4: Configurer variables d'environnement

### 4.1 Accéder à Environment
Dans votre Web Service → **"Environment"** tab → **"Add Environment Variable"**

### 4.2 Variables essentielles

#### Base de données (CRITIQUE)
```bash
DATABASE_URL=postgresql://gema_user:MOT_DE_PASSE@dpg-xxxxx.oregon-postgres.render.com/gema
```
⚠️ Utiliser **Internal Database URL** (pas External)

#### NextAuth (REQUIS)
```bash
# Générer secret:
# Terminal: openssl rand -base64 32

NEXTAUTH_SECRET=votre_secret_genere_ici
NEXTAUTH_URL=https://gema-app.onrender.com

# Ou custom domain:
# NEXTAUTH_URL=https://votre-domaine.com
```

#### Clerk Authentication (si utilisé)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

#### Node Environment
```bash
NODE_ENV=production
```

### 4.3 Sauvegarder
Cliquer **"Save Changes"** → Le déploiement redémarre automatiquement

---

## Étape 5: Premier déploiement

### 5.1 Suivre les logs
Dans **"Logs"** tab, surveiller:

```
==> Cloning from GitHub...
==> Running 'npm install'
✓ Dependencies installed

==> Running 'npx prisma generate'
✓ Generated Prisma Client

==> Running 'npx prisma migrate deploy'
✓ Migrations applied (si schéma a changé)

==> Running 'npm run build'
✓ Compiled successfully

==> Starting service with 'npm run start'
✓ Server listening on port 10000
```

### 5.2 Vérifier succès
```
==> Your service is live 🎉
https://gema-app.onrender.com
```

---

## Étape 6: Tests post-déploiement

### 6.1 Tests fonctionnels

#### Test 1: Page d'accueil
```bash
curl https://gema-app.onrender.com
# Devrait retourner HTML (code 200)
```

#### Test 2: API route
```bash
curl https://gema-app.onrender.com/api/user
# Devrait retourner JSON (possiblement 401 non authentifié)
```

#### Test 3: Connexion base de données
1. Aller sur votre app
2. Essayer de se connecter
3. Vérifier dans Render **Logs** qu'il n'y a pas d'erreurs Prisma

### 6.2 Erreurs communes et solutions

#### ❌ "Too many connections" (Pool exhausted)
**Cause**: Fichiers utilisent encore `new PrismaClient()`  
**Solution**: Vérifier que TOUS les fichiers utilisent `import prisma from '@/lib/prisma'`

```bash
# Vérifier localement:
cd /Users/sidielysegane/Desktop/gema
grep -r "new PrismaClient()" app/
# Devrait retourner 0 résultats
```

#### ❌ "NEXTAUTH_URL or NEXTAUTH_SECRET is missing"
**Solution**: Ajouter variables dans Render Environment

#### ❌ Build échoue "prisma command not found"
**Solution**: Build Command doit inclure `npx prisma generate`

#### ❌ "Database connection failed"
**Causes possibles**:
1. DATABASE_URL incorrect → Vérifier copié depuis Internal URL
2. DB et Web Service dans régions différentes → Recréer dans même région
3. Firewall → Render gère ça automatiquement, pas de config

---

## Étape 7: Migrations Prisma en production

### 7.1 Workflow recommandé

#### Développement local
```bash
# Modifier schema.prisma
npx prisma migrate dev --name description_changement
```

#### Déploiement
```bash
# Commit migration files
git add prisma/migrations/
git commit -m "Add migration: description_changement"
git push origin main
```

Render détecte le push et:
1. Clone nouveau code
2. Lance `npx prisma migrate deploy` automatiquement
3. Applique nouvelles migrations SANS reset

### 7.2 Migrations manuelles (si besoin)

Dans Render Dashboard → **"Shell"** tab:
```bash
npx prisma migrate deploy
```

---

## Étape 8: Custom Domain (optionnel)

### 8.1 Configuration Render
1. Web Service → **"Settings"** → **"Custom Domains"**
2. Cliquer **"Add Custom Domain"**
3. Entrer: `app.votre-domaine.com`

### 8.2 Configuration DNS
Chez votre registrar (OVH, Namecheap, etc.):

**Option A: CNAME (recommandé)**
```
Type: CNAME
Name: app
Value: gema-app.onrender.com
TTL: 3600
```

**Option B: A Record**
```
Type: A
Name: app
Value: [IP fournie par Render]
TTL: 3600
```

### 8.3 Mettre à jour NEXTAUTH_URL
```bash
NEXTAUTH_URL=https://app.votre-domaine.com
```

---

## Étape 9: Monitoring et logs

### 9.1 Logs en temps réel
Render Dashboard → **"Logs"** → Surveiller:
- ✅ Requêtes API
- ❌ Erreurs Prisma
- ⚠️ Warnings Next.js

### 9.2 Métriques
**"Metrics"** tab montre:
- CPU usage
- Memory usage
- Request rate
- Response times

### 9.3 Alertes (plans payants)
Configurer notifications pour:
- Service down
- High error rate
- Memory/CPU limits

---

## Étape 10: Optimisations production

### 10.1 Augmenter timeout (si queries lentes)
Render Settings → **"Advanced"**:
```
Health Check Path: /api/user
Start Timeout: 60 seconds (défaut: 30)
```

### 10.2 Auto-scaling (plans Standard+)
```
Min Instances: 1
Max Instances: 3
Auto-scale: Based on CPU/Memory
```

### 10.3 Environnements multiples

#### Staging
1. Créer branche `staging`
2. Nouveau Web Service: `gema-staging`
3. Pointer sur branche `staging`
4. Nouvelle DB: `gema-staging-db`

#### Production
1. Branche `main` → `gema-app`
2. DB: `gema-db`

---

## 📋 Checklist finale

### Pre-deployment
- [ ] `.nvmrc` avec `20`
- [ ] `output: 'standalone'` dans next.config.ts
- [ ] Tous les `new PrismaClient()` remplacés par singleton
- [ ] Build local réussit: `npm run build`
- [ ] Code poussé sur GitHub

### Render Configuration
- [ ] PostgreSQL database créée
- [ ] Web Service créé et lié au repo
- [ ] Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- [ ] Start Command: `npm run start`
- [ ] Variables d'environnement configurées:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_SECRET
  - [ ] NEXTAUTH_URL
  - [ ] NODE_ENV=production

### Post-deployment
- [ ] Service démarré sans erreurs
- [ ] Page d'accueil accessible
- [ ] Connexion/Sign up fonctionne
- [ ] Routes API répondent
- [ ] Pas d'erreurs dans logs Render

---

## 🆘 Support et ressources

### Documentation officielle
- **Render**: https://render.com/docs
- **Next.js**: https://nextjs.org/docs/deployment
- **Prisma**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render

### Problèmes fréquents

#### App démarre puis crash après 5 min
**Cause**: Plan Free s'endort après 15 min d'inactivité  
**Solution**: Upgrade vers plan Starter ($7/mois)

#### Builds très lents (>10 min)
**Cause**: `npm install` télécharge tout  
**Solutions**:
1. Utiliser cache Render (automatique)
2. Supprimer dépendances inutiles
3. Upgrade instance type

#### Base de données pleine
**Cause**: Plan Free limité à 1 GB  
**Solutions**:
1. Vérifier taille: Render DB → Metrics
2. Nettoyer anciennes données
3. Upgrade plan DB

---

## 🎉 Félicitations !

Votre application Next.js 16 est maintenant déployée en production sur Render.com avec:
✅ PostgreSQL géré
✅ Migrations automatiques
✅ HTTPS activé
✅ Auto-deploy depuis GitHub

**URL de production**: `https://gema-app.onrender.com`

Pour toute question, consultez les logs Render ou la documentation officielle.
