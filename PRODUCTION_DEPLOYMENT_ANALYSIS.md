# 🔍 Analyse de Déploiement Production - GeStock sur Windows

**Date d'analyse :** 1 décembre 2025  
**Cible :** Serveur Windows en réseau LAN  
**Base de données :** PostgreSQL (production)

---

## ✅ État Actuel de Préparation

### 🎯 Points Forts Déjà Implémentés

#### 1. **Scripts de Déploiement Windows** ✅
- ✅ `deploy-windows.bat` - Déploiement automatique complet
- ✅ `start-windows.bat` - Démarrage rapide
- ✅ `install-nssm-service.bat` - Installation comme service Windows
- ✅ `configure-firewall.bat` - Configuration pare-feu
- ✅ Scripts PowerShell pour backup/restore

#### 2. **Configuration Next.js Production** ✅
```typescript
// next.config.ts
{
  output: 'standalone',        // ✅ Build optimisé
  compress: true,              // ✅ Compression activée
  poweredByHeader: false,      // ✅ Sécurité
  headers: [                   // ✅ Headers sécurité
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    ...
  ]
}
```

#### 3. **Système de Backup/Restore** ✅
- ✅ Support SQLite (dev) et PostgreSQL (prod)
- ✅ Détection automatique OS (Windows/macOS/Linux)
- ✅ Chemins adaptés : `C:\gestock\backups` (Windows)
- ✅ Rotation et nettoyage automatiques
- ✅ Interface admin (`/admin/backup`)
- ✅ Scripts PowerShell backup automatisé

#### 4. **Système de Logs** ✅
- ✅ Logger complet avec rotation
- ✅ Niveaux : DEBUG, INFO, WARN, ERROR, FATAL
- ✅ Interface admin (`/admin/logs`)
- ✅ Fichiers dans `./logs/` (adapté Windows)

#### 5. **Base de Données** ✅
```prisma
// schema.prisma
datasource db {
  provider = "sqlite"  // Dev
  // provider = "postgresql"  // Production
  url = env("DATABASE_URL")
}
```
- ✅ Migrations Prisma prêtes
- ✅ Support SQLite (dev) et PostgreSQL (prod)
- ✅ Scripts migration inclus

#### 6. **Sécurité** ✅
- ✅ NextAuth.js configuré
- ✅ Variables d'environnement documentées (`.env.example`)
- ✅ Headers de sécurité (HSTS, CSP, XSS Protection)
- ✅ Secrets à générer en production

---

## ⚠️ Points d'Attention Critiques

### 🔴 Haute Priorité - À Corriger Avant Déploiement

#### 1. **Gestion des Uploads (Images Produits)**

**Problème :** Stockage local `public/uploads/` inadapté pour production

**État actuel :**
```typescript
// Prisma
model Produit {
  imageUrl String  // Stocké comme "/uploads/filename.jpg"
}

// next.config.ts
images: {
  remotePatterns: [
    { hostname: 'localhost', pathname: '/uploads/**' }
  ]
}
```

**Risques :**
- ❌ Perte de fichiers lors redémarrage avec `output: 'standalone'`
- ❌ Problèmes de permissions Windows
- ❌ Pas de réplication multi-serveurs
- ❌ Sauvegarde base de données ≠ sauvegarde images

**Solutions recommandées :**

**Option A : Stockage dans dossier persistant externe**
```
C:\gestock\
  ├── app\               # Application
  ├── uploads\          # Images (persistant)
  ├── backups\          # Sauvegardes
  └── logs\             # Logs
```

**Option B : Base64 en base de données** (simple mais limite)
```typescript
// Encoder images en base64 directement en DB
imageUrl: string  // "data:image/jpeg;base64,..."
```

**Option C : Cloud Storage** (recommandé long terme)
- Azure Blob Storage
- AWS S3
- Cloudflare R2

**Action immédiate :** Choisir Option A ou B avant déploiement

#### 2. **Variables d'Environnement Production**

**Fichier `.env` actuel :** (développement)
```env
DATABASE_URL="file:./prisma/dev.db"  # ❌ SQLite
NEXTAUTH_URL=http://localhost:3000   # ❌ Localhost
NEXTAUTH_SECRET=CHANGER_...          # ❌ À générer
ADMIN_SECRET_KEY=CHANGER_...         # ❌ À générer
```

**Configuration production requise :**
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://gestock_user:MOT_DE_PASSE@localhost:5432/gestock_prod?schema=public"

# URL réseau LAN
NEXTAUTH_URL=http://192.168.X.X:3000
# OU avec nom DNS
NEXTAUTH_URL=http://gestock.entreprise.local:3000

# Secrets générés (CRITIQUES !)
NEXTAUTH_SECRET=<générer_avec_openssl>
ADMIN_SECRET_KEY=<générer_avec_openssl>

# Logs production
LOG_LEVEL=INFO                    # Pas DEBUG
LOG_ENABLE_CONSOLE=false          # Désactiver console
LOG_ENABLE_FILE=true              # Fichiers uniquement

# Node
NODE_ENV=production
```

**Générer secrets sécurisés :**
```powershell
# PowerShell Windows
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Action :** Créer `.env.production` avec vraies valeurs

#### 3. **Base de Données PostgreSQL**

**Migration SQLite → PostgreSQL :**

```bash
# 1. Changer provider dans schema.prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

# 2. Régénérer client Prisma
npx prisma generate

# 3. Créer base PostgreSQL
psql -U postgres
CREATE DATABASE gestock_prod;
CREATE USER gestock_user WITH PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE gestock_prod TO gestock_user;

# 4. Appliquer migrations
npx prisma migrate deploy
```

**Dump données existantes (si nécessaire) :**
```bash
# SQLite → PostgreSQL (nécessite pgloader)
pgloader sqlite://./prisma/dev.db postgresql://user:pass@localhost/gestock_prod
```

**Action :** Installer PostgreSQL 15+ et configurer

#### 4. **Ports et Réseau**

**Configuration actuelle :** Port 3000 (par défaut)

**Vérifications Windows :**
```cmd
# Pare-feu Windows
netsh advfirewall firewall add rule name="GeStock" dir=in action=allow protocol=TCP localport=3000

# Vérifier port disponible
netstat -ano | findstr :3000

# Test réseau LAN
curl http://192.168.X.X:3000
```

**Nginx reverse proxy (optionnel mais recommandé) :**
- ✅ Fichier `nginx.conf` déjà fourni
- Port 80 → 3000 (proxy)
- Gestion SSL/TLS
- Compression
- Cache statique

**Action :** Configurer pare-feu et tester accès réseau

---

### 🟡 Moyenne Priorité - Optimisations

#### 5. **Performance et Monitoring**

**PM2 Process Manager :** ✅ Déjà configuré
```javascript
// ecosystem.config.js
{
  instances: 1,           // ⚠️ Augmenter à 2-4 si serveur puissant
  max_memory_restart: '1G',
  autorestart: true,
  watch: false,          // ✅ Désactivé en prod
  env_production: {
    NODE_ENV: 'production'
  }
}
```

**Recommandations :**
- Augmenter `instances` selon CPU (n-1)
- Surveiller RAM : `pm2 monit`
- Logs PM2 : `C:\gestock\logs\`

#### 6. **Sécurité Renforcée**

**À ajouter :**

1. **Rate Limiting API**
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

// Limiter requêtes API
const ratelimit = new Ratelimit({
  redis: ...,
  limiter: Ratelimit.slidingWindow(10, '10s')
});
```

2. **CORS Strict**
```typescript
// next.config.ts
async headers() {
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'http://192.168.X.X:3000' }
    ]
  }]
}
```

3. **Logs d'Audit Utilisateurs**
```typescript
// Déjà implémenté partiellement dans logger.ts
logger.logWithUser('INFO', 'Auth', 'Connexion', userId, userEmail);
```

#### 7. **Sauvegarde Automatisée**

**Déjà implémenté :** ✅
- Script `setup-backup-schedule.bat`
- Tâche planifiée Windows
- Backup quotidien 2h du matin

**À vérifier :**
```cmd
# Lister tâches planifiées
schtasks /query /tn "GeStock Backup"

# Test manuel
node scripts/auto-backup.mjs
```

**Ajout recommandé :** Backup externe
- Copier `C:\gestock\backups\` vers NAS/cloud
- Script PowerShell hebdomadaire

---

### 🟢 Basse Priorité - Nice to Have

#### 8. **Monitoring et Alertes**

**Options :**
- Grafana + Prometheus (métriques temps réel)
- Sentry (erreurs application)
- UptimeRobot (disponibilité)
- Email automatique si crash

#### 9. **Documentation Utilisateur**

**Manquant :**
- Guide d'utilisation pour utilisateurs finaux
- Procédures métier (alimentations, octrois)
- FAQ administrateurs

#### 10. **Tests**

**Actuellement :** Pas de tests automatisés

**À ajouter (optionnel) :**
```bash
# Tests unitaires
npm install -D jest @testing-library/react

# Tests E2E
npm install -D playwright
```

---

## 📋 Checklist Déploiement Production

### Avant Déploiement

- [ ] **PostgreSQL installé et configuré**
  - [ ] Base de données `gestock_prod` créée
  - [ ] Utilisateur `gestock_user` avec permissions
  - [ ] PostgreSQL dans PATH Windows

- [ ] **Fichier .env production créé**
  - [ ] `DATABASE_URL` PostgreSQL configurée
  - [ ] `NEXTAUTH_URL` avec IP/DNS réseau
  - [ ] `NEXTAUTH_SECRET` généré (32+ chars)
  - [ ] `ADMIN_SECRET_KEY` généré (32+ chars)
  - [ ] `LOG_LEVEL=INFO`
  - [ ] `NODE_ENV=production`

- [ ] **Gestion uploads résolue**
  - [ ] Choisir solution (dossier externe/base64/cloud)
  - [ ] Tester upload/affichage images
  - [ ] Migrer images existantes si nécessaire

- [ ] **Build testé localement**
  ```cmd
  npm run build
  npm run start
  # Tester sur http://localhost:3000
  ```

- [ ] **Migrations base de données**
  ```cmd
  npx prisma generate
  npx prisma migrate deploy
  ```

### Pendant Déploiement

- [ ] **Serveur Windows préparé**
  - [ ] Node.js 18+ installé
  - [ ] PostgreSQL 15+ installé
  - [ ] PM2 installé globalement (`npm install -g pm2`)
  - [ ] Git installé (optionnel)

- [ ] **Fichiers copiés sur serveur**
  ```
  C:\gestock\
  ```

- [ ] **Dépendances installées**
  ```cmd
  cd C:\gestock
  npm install --production
  ```

- [ ] **Pare-feu configuré**
  ```cmd
  configure-firewall.bat
  ```

- [ ] **Service Windows créé**
  ```cmd
  install-nssm-service.bat
  ```

- [ ] **Premier administrateur créé**
  ```cmd
  node create-admin.mjs
  ```

### Après Déploiement

- [ ] **Tests d'accès réseau**
  - [ ] Depuis serveur : `http://localhost:3000`
  - [ ] Depuis poste client : `http://192.168.X.X:3000`
  - [ ] Connexion admin fonctionnelle

- [ ] **Tests fonctionnels**
  - [ ] Création utilisateur
  - [ ] Upload image produit
  - [ ] Création alimentation
  - [ ] Workflow validation
  - [ ] Génération rapport

- [ ] **Vérification logs**
  ```cmd
  type C:\gestock\logs\app-*.log
  pm2 logs gestock
  ```

- [ ] **Backup automatique configuré**
  ```cmd
  setup-backup-schedule.bat
  ```

- [ ] **Test restauration backup**
  ```cmd
  # Créer backup test
  # Restaurer backup test
  # Vérifier intégrité données
  ```

- [ ] **Monitoring activé**
  - [ ] PM2 : `pm2 monit`
  - [ ] Logs : `/admin/logs`
  - [ ] Backups : `/admin/backup`

---

## 🚨 Problèmes Connus et Solutions

### Problème 1 : Erreur P2025 Prisma (Product not found)

**Symptôme :** Erreur lors modification produit

**Cause :** Race condition dashboard refresh

**Solution :** ✅ Déjà corrigée dans `PRISMA_P2025_ERROR_FIX.md`

### Problème 2 : Upload images 404

**Symptôme :** Images produits introuvables après redémarrage

**Cause :** `output: 'standalone'` ne copie pas `public/uploads/`

**Solution :** Utiliser dossier externe (voir section 1)

### Problème 3 : Logs console en production

**Symptôme :** Performance dégradée

**Solution :** 
```env
LOG_ENABLE_CONSOLE=false
LOG_LEVEL=INFO  # Pas DEBUG
```

### Problème 4 : Connexion PostgreSQL échoue

**Symptôme :** Erreur "connection refused"

**Solutions :**
```bash
# 1. Vérifier PostgreSQL actif
sc query postgresql-x64-15

# 2. Vérifier pg_hba.conf
# Ajouter ligne :
host    all    all    127.0.0.1/32    md5

# 3. Redémarrer PostgreSQL
net stop postgresql-x64-15
net start postgresql-x64-15
```

---

## 📊 Estimation Ressources Serveur

### Configuration Minimale
- **CPU :** 2 cores
- **RAM :** 4 GB
- **Disque :** 20 GB (système + app + backups)
- **Réseau :** 100 Mbps

### Configuration Recommandée
- **CPU :** 4 cores
- **RAM :** 8 GB
- **Disque :** 50 GB SSD
- **Réseau :** 1 Gbps

### Utilisation Estimée (20 utilisateurs simultanés)
- **RAM App :** 500 MB - 1 GB
- **RAM PostgreSQL :** 256 MB - 512 MB
- **CPU :** 10-30% (pics à 50% lors build)
- **Disque (logs/backups) :** ~5 GB/mois

---

## 🎯 Plan d'Action Recommandé

### Semaine 1 : Préparation (5 jours)

**Jour 1-2 :** Infrastructure
- Installer PostgreSQL sur serveur Windows
- Configurer utilisateur/base de données
- Tester connexion depuis application

**Jour 3 :** Uploads
- Décider solution stockage images
- Implémenter changements code
- Migrer images existantes

**Jour 4 :** Configuration
- Créer fichier `.env.production`
- Générer secrets sécurisés
- Documenter credentials (coffre-fort !)

**Jour 5 :** Tests locaux
- Build production en local
- Tester avec PostgreSQL
- Vérifier tous les workflows

### Semaine 2 : Déploiement (3 jours)

**Jour 1 :** Déploiement initial
- Copier fichiers sur serveur
- Installer dépendances
- Configurer service Windows

**Jour 2 :** Tests et ajustements
- Tests fonctionnels complets
- Correction bugs éventuels
- Optimisation performances

**Jour 3 :** Formation et docs
- Former administrateurs
- Documenter procédures
- Créer comptes utilisateurs

### Post-Déploiement : Surveillance (continu)

**Quotidien :**
- Vérifier logs erreurs (`/admin/logs`)
- Surveiller espace disque
- Tester accès application

**Hebdomadaire :**
- Vérifier backups (`/admin/backup`)
- Analyser performances (PM2)
- Mettre à jour dépendances si sécurité

**Mensuel :**
- Nettoyer logs anciens
- Archiver backups externes
- Audit sécurité

---

## 📚 Documentation Existante

Le projet contient déjà une documentation complète :

1. **WINDOWS_DEPLOY.md** - Guide déploiement Windows détaillé
2. **BACKUP_RESTORE_GUIDE.md** - Système backup/restore
3. **LOGGING_SYSTEM.md** - Documentation logs
4. **QUICK_START.md** - Démarrage rapide
5. **README.md** - Vue d'ensemble projet

---

## 🔐 Sécurité - Points Critiques

### À Faire Absolument

1. **Changer tous les secrets par défaut**
   ```env
   NEXTAUTH_SECRET=...  # ≠ "CHANGER_CETTE_VALEUR"
   ADMIN_SECRET_KEY=... # ≠ "CHANGER_CETTE_VALEUR"
   ```

2. **Mot de passe PostgreSQL fort**
   ```
   Minimum 16 caractères
   Majuscules + minuscules + chiffres + symboles
   ```

3. **Limiter accès réseau**
   ```
   Pare-feu : Autoriser uniquement réseau LAN
   PostgreSQL : Écouter sur 127.0.0.1 uniquement
   ```

4. **Sauvegarder credentials**
   ```
   Ne PAS commiter .env dans Git
   Stocker dans coffre-fort entreprise
   Documentation mot de passe séparée (sécurisée)
   ```

### Recommandations Supplémentaires

- Activer SSL/TLS avec Nginx (certificat auto-signé OK en LAN)
- Logs d'audit pour actions admin
- Rotation mots de passe tous les 90 jours
- Backup 3-2-1 : 3 copies, 2 supports, 1 hors site

---

## ✅ Conclusion

### Points Positifs
- ✅ Application bien structurée
- ✅ Scripts Windows déjà préparés
- ✅ Système backup/restore robuste
- ✅ Logs complets
- ✅ Sécurité de base implémentée

### Actions Critiques Avant Production
1. 🔴 **Résoudre stockage images uploads**
2. 🔴 **Configurer PostgreSQL production**
3. 🔴 **Créer .env production avec vrais secrets**
4. 🟡 **Tester accès réseau LAN**
5. 🟡 **Former administrateurs**

### Temps Estimé Déploiement
- **Préparation :** 3-5 jours (avec tests)
- **Déploiement :** 1-2 jours
- **Formation :** 1 jour
- **Total :** **1-2 semaines** (si tout se passe bien)

### Prêt pour Production ?
**Actuellement :** 75% ✅

**Manque :** 
- Gestion uploads (critique)
- Configuration PostgreSQL (critique)
- Tests réseau LAN (important)

**Avec corrections :** 95% production-ready ✅

---

**Prochaine étape recommandée :** Choisir et implémenter solution stockage images (uploads) avant tout déploiement.
