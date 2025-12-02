# 💾 Système de Sauvegarde et Restauration - GeStock

## Vue d'ensemble

GeStock dispose d'un système complet de sauvegarde et restauration pour PostgreSQL, spécialement conçu pour un déploiement sur serveur Windows en réseau LAN.

## 📋 Table des matières

1. [Fonctionnalités](#fonctionnalités)
2. [Prérequis](#prérequis)
3. [Configuration Initiale](#configuration-initiale)
4. [Utilisation](#utilisation)
5. [Sauvegarde Automatique](#sauvegarde-automatique)
6. [Restauration](#restauration)
7. [Scripts PowerShell](#scripts-powershell)
8. [API Backend](#api-backend)
9. [Dépannage](#dépannage)
10. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🎯 Fonctionnalités

### ✅ Sauvegarde
- **Création manuelle** via interface admin
- **Sauvegarde automatique** programmable (3, 6, 12, 24 heures)
- **Format compressé** (pg_dump format custom)
- **Organisation par mois** (YYYY-MM)
- **Nettoyage automatique** (sauvegardes > 30 jours)
- **Logs détaillés** de chaque opération

### ✅ Restauration
- **Restauration manuelle** depuis interface admin
- **Sauvegarde de sécurité** automatique avant restauration
- **Vérification d'intégrité** après restauration
- **Gestion des connexions actives** (fermeture propre)
- **Confirmation multi-niveaux** pour éviter les erreurs

### ✅ Interface Admin
- **Dashboard visuel** avec statistiques
- **Liste des sauvegardes** avec détails (taille, date, âge)
- **Actions en un clic** (créer, restaurer, nettoyer)
- **Accès restreint** aux administrateurs uniquement

---

## 📦 Prérequis

### 1. PostgreSQL installé
```powershell
# Vérifier l'installation
pg_dump --version
pg_restore --version
psql --version
```

### 2. PostgreSQL dans le PATH Windows
```
C:\Program Files\PostgreSQL\14\bin
```

### 3. Variables d'environnement (.env)
```env
# Base de données
DATABASE_URL="postgresql://gestock_user:PASSWORD@localhost:5432/gestock_prod"
DATABASE_NAME=gestock_prod
DATABASE_USER=gestock_user
DATABASE_PASSWORD=votre_mot_de_passe
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Sauvegarde
BACKUP_DIR=C:\gestock\backups
BACKUP_RETENTION_DAYS=30

# Pour PostgreSQL (optionnel)
PGPASSWORD=votre_mot_de_passe
POSTGRES_PASSWORD=mot_de_passe_postgres
```

### 4. Dossier de sauvegarde
```powershell
# Créer le dossier
New-Item -ItemType Directory -Path "C:\gestock\backups" -Force
```

---

## ⚙️ Configuration Initiale

### Étape 1: Vérifier la configuration

Exécutez le script de vérification :
```powershell
cd C:\gestock
node scripts/auto-backup.mjs
```

Ou via l'API :
```http
GET http://localhost:3000/api/admin/backup?action=check
```

### Étape 2: Configurer la sauvegarde automatique

**Option A: Tâche planifiée Windows (Recommandé)**
```batch
# Double-cliquez sur :
setup-backup-schedule.bat

# Choisissez la fréquence :
# 1. Toutes les 6 heures (recommandé pour production)
# 2. Toutes les 12 heures
# 3. Une fois par jour (3h00)
# 4. Toutes les 3 heures
```

**Option B: Exécution manuelle**
```powershell
# Sauvegarde unique
.\backup-database.ps1 -Verbose

# Avec compression
.\backup-database.ps1 -Compress -Verbose
```

### Étape 3: Tester la sauvegarde

**Via PowerShell :**
```powershell
.\backup-database.ps1 -Verbose
```

**Via Node.js :**
```bash
node scripts/auto-backup.mjs
```

**Via l'interface admin :**
1. Connectez-vous en tant qu'administrateur
2. Allez sur `/admin/backup`
3. Cliquez sur "Créer Sauvegarde"

---

## 🖥️ Utilisation

### Interface Web Admin

#### Accès
```
URL: http://serveur:3000/admin/backup
Accès: Administrateurs uniquement
```

#### Tableau de bord
- **Total Sauvegardes** : Nombre total de sauvegardes
- **Espace Total** : Espace disque utilisé (MB)
- **Plus Récente** : Date de la dernière sauvegarde
- **Plus Ancienne** : Date de la plus vieille sauvegarde

#### Actions disponibles

**1. Créer Sauvegarde**
```
Bouton: "Créer Sauvegarde"
Durée: 5-30 secondes (selon taille DB)
Résultat: Fichier .backup dans C:\gestock\backups\YYYY-MM\
```

**2. Restaurer**
```
Bouton: "Restaurer" (sur chaque sauvegarde)
Confirmation: Double confirmation requise
Durée: 30-120 secondes
⚠️  ATTENTION: Écrase toutes les données actuelles!
```

**3. Nettoyer Anciennes**
```
Bouton: "Nettoyer Anciennes"
Action: Supprime sauvegardes > 30 jours
Libère: Espace disque
```

**4. Actualiser**
```
Bouton: "Actualiser"
Action: Recharge la liste des sauvegardes
```

---

## 🤖 Sauvegarde Automatique

### Configuration avec Task Scheduler

**1. Exécuter le script de configuration**
```batch
# Clic-droit "Exécuter en tant qu'administrateur"
setup-backup-schedule.bat
```

**2. Choisir la fréquence**
- Production : **Toutes les 6 heures**
- Développement : **Toutes les 12 heures**
- Test : **Une fois par jour**

**3. Vérifier la tâche**
```powershell
# Ouvrir Planificateur de tâches
taskschd.msc

# Chercher "GeStock-Backup-Auto"
# Onglet "Général" : Vérifier "Exécuter avec les privilèges les plus élevés"
# Onglet "Déclencheurs" : Vérifier l'intervalle
```

**4. Tester manuellement**
```powershell
schtasks /Run /TN "GeStock-Backup-Auto"

# Vérifier les logs
type C:\gestock\logs\backup-auto.log
```

### Logs de sauvegarde

**Emplacement :**
```
C:\gestock\backups\backup.log
C:\gestock\logs\backup-auto.log
```

**Format :**
```
[2025-12-01 14:30:00] [INFO] Démarrage sauvegarde PostgreSQL...
[2025-12-01 14:30:01] ✓ [SUCCESS] Sauvegarde créée - Taille: 45.23 MB - Durée: 12.5s
[2025-12-01 14:30:02] [INFO] Nettoyage sauvegardes anciennes...
[2025-12-01 14:30:02] ✓ [SUCCESS] Nettoyage terminé - 3 fichiers supprimés
```

---

## 🔄 Restauration

### ⚠️ AVERTISSEMENTS CRITIQUES

**AVANT DE RESTAURER :**
1. ❌ **TOUTES les données actuelles seront ÉCRASÉES**
2. ❌ **Cette opération est IRRÉVERSIBLE**
3. ✅ Une sauvegarde de sécurité est créée automatiquement
4. ✅ Assurez-vous que personne n'utilise l'application

### Processus de restauration

#### Via Interface Web (Recommandé)

**1. Accéder à l'interface**
```
URL: http://serveur:3000/admin/backup
```

**2. Sélectionner une sauvegarde**
```
Liste des sauvegardes disponibles
Informations: Date, Taille, Âge
```

**3. Cliquer sur "Restaurer"**
```
⚠️  Confirmation 1: "Cette action va écraser TOUTES les données..."
⚠️  Confirmation 2: Tapez "RESTAURER"
```

**4. Attendre la fin**
```
Étapes:
1. Création sauvegarde de sécurité
2. Fermeture connexions actives
3. Suppression base actuelle
4. Création base vierge
5. Restauration des données
6. Vérification
7. Rechargement page
```

#### Via PowerShell

**1. Lister les sauvegardes**
```powershell
.\restore-database.ps1 -ListBackups
```

**2. Restaurer la dernière**
```powershell
.\restore-database.ps1 -Latest -Force
```

**3. Restaurer un fichier spécifique**
```powershell
.\restore-database.ps1 -BackupFile "C:\gestock\backups\2025-12\gestock_prod_2025-12-01_14-30-00.backup" -Force
```

#### Via API

**Restaurer la dernière sauvegarde :**
```http
POST http://localhost:3000/api/admin/restore
Content-Type: application/json

{
  "useLatest": true
}
```

**Restaurer un fichier spécifique :**
```http
POST http://localhost:3000/api/admin/restore
Content-Type: application/json

{
  "backupFilePath": "C:\\gestock\\backups\\2025-12\\gestock_prod_2025-12-01_14-30-00.backup"
}
```

### Après restauration

**1. Vérifier l'application**
```
URL: http://serveur:3000
Connexion: Testez avec un compte admin
```

**2. Vérifier les données**
```sql
-- Se connecter à PostgreSQL
psql -U gestock_user -d gestock_prod

-- Compter les enregistrements
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Produit";
SELECT COUNT(*) FROM "Alimentation";
SELECT COUNT(*) FROM "Octroi";
```

**3. Sauvegarde de sécurité**
```
Emplacement: C:\gestock\backups\pre-restore_YYYY-MM-DD_HH-MM-SS.backup
Conservation: 30 jours
Usage: En cas de problème, restaurer cette sauvegarde
```

---

## 📜 Scripts PowerShell

### backup-database.ps1

**Usage :**
```powershell
# Sauvegarde simple
.\backup-database.ps1

# Avec logs verbeux
.\backup-database.ps1 -Verbose

# Avec compression
.\backup-database.ps1 -Compress

# Personnalisé
.\backup-database.ps1 `
  -BackupDir "D:\Backups" `
  -DatabaseName "gestock_prod" `
  -DatabaseUser "gestock_user" `
  -RetentionDays 60 `
  -Compress `
  -Verbose
```

**Paramètres :**
- `BackupDir` : Dossier des sauvegardes (défaut: C:\gestock\backups)
- `DatabaseName` : Nom de la base (défaut: gestock_prod)
- `DatabaseUser` : Utilisateur PostgreSQL (défaut: gestock_user)
- `RetentionDays` : Rétention en jours (défaut: 30)
- `Compress` : Activer compression ZIP
- `Verbose` : Afficher logs détaillés

### restore-database.ps1

**Usage :**
```powershell
# Lister sauvegardes
.\restore-database.ps1 -ListBackups

# Restaurer dernière
.\restore-database.ps1 -Latest

# Restaurer fichier spécifique
.\restore-database.ps1 -BackupFile "chemin\fichier.backup"

# Sans confirmation (automatisation)
.\restore-database.ps1 -Latest -Force
```

**Paramètres :**
- `BackupFile` : Fichier de sauvegarde à restaurer
- `Latest` : Utiliser la dernière sauvegarde
- `ListBackups` : Lister les sauvegardes disponibles
- `Force` : Ignorer les confirmations
- `CreateNew` : Créer nouvelle DB au lieu d'écraser

---

## 🔌 API Backend

### Endpoints disponibles

#### GET /api/admin/backup

**Lister les sauvegardes :**
```http
GET /api/admin/backup?action=list
Authorization: Cookie (session admin)

Response:
{
  "success": true,
  "data": [
    {
      "fileName": "gestock_prod_2025-12-01_14-30-00.backup",
      "filePath": "C:\\gestock\\backups\\2025-12\\gestock_prod_2025-12-01_14-30-00.backup",
      "size": 47456789,
      "sizeMB": "45.26",
      "createdAt": "2025-12-01T14:30:00Z",
      "ageHours": "2.5",
      "ageDays": "0.1"
    }
  ]
}
```

**Statistiques :**
```http
GET /api/admin/backup?action=stats

Response:
{
  "success": true,
  "data": {
    "totalBackups": 15,
    "totalSizeMB": 678.45,
    "oldestBackup": "2025-11-01T03:00:00Z",
    "newestBackup": "2025-12-01T14:30:00Z"
  }
}
```

**Vérifier configuration :**
```http
GET /api/admin/backup?action=check

Response:
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

#### POST /api/admin/backup

**Créer sauvegarde :**
```http
POST /api/admin/backup
Content-Type: application/json

{
  "action": "create"
}

Response:
{
  "success": true,
  "message": "Sauvegarde créée avec succès (45.26 MB)",
  "filePath": "C:\\gestock\\backups\\2025-12\\gestock_prod_2025-12-01_14-30-00.backup"
}
```

**Nettoyer anciennes sauvegardes :**
```http
POST /api/admin/backup
Content-Type: application/json

{
  "action": "clean"
}

Response:
{
  "success": true,
  "message": "3 sauvegardes supprimées, 135.67 MB libérés",
  "data": {
    "deletedCount": 3,
    "freedSpaceMB": 135.67
  }
}
```

#### POST /api/admin/restore

**Restaurer sauvegarde :**
```http
POST /api/admin/restore
Content-Type: application/json

{
  "backupFilePath": "C:\\gestock\\backups\\2025-12\\gestock_prod_2025-12-01_14-30-00.backup"
}

Response:
{
  "success": true,
  "message": "Base de données restaurée avec succès (45.23s)"
}
```

---

## 🔧 Dépannage

### Problème: pg_dump non trouvé

**Erreur :**
```
pg_dump non trouvé - PostgreSQL doit être installé et dans le PATH
```

**Solution :**
```powershell
# 1. Vérifier l'installation PostgreSQL
Get-Command pg_dump

# 2. Ajouter au PATH
$env:Path += ";C:\Program Files\PostgreSQL\14\bin"

# 3. Permanent (PowerShell Admin)
[Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";C:\Program Files\PostgreSQL\14\bin",
  [EnvironmentVariableTarget]::Machine
)
```

### Problème: Erreur mot de passe

**Erreur :**
```
password authentication failed
```

**Solution :**
```powershell
# 1. Définir PGPASSWORD
$env:PGPASSWORD = "votre_mot_de_passe"

# 2. Ou dans .env
DATABASE_PASSWORD=votre_mot_de_passe
```

### Problème: Permission denied

**Erreur :**
```
Permission denied: C:\gestock\backups
```

**Solution :**
```powershell
# Donner permissions complètes
icacls "C:\gestock\backups" /grant "SYSTEM:(OI)(CI)F" /T
icacls "C:\gestock\backups" /grant "Administrators:(OI)(CI)F" /T
```

### Problème: Database already exists

**Erreur lors de restauration :**
```
database "gestock_prod" already exists
```

**Solution :**
```powershell
# Option 1: Utiliser --clean
pg_restore --clean --if-exists ...

# Option 2: Supprimer manuellement
psql -U postgres -c "DROP DATABASE gestock_prod"
psql -U postgres -c "CREATE DATABASE gestock_prod OWNER gestock_user"
```

### Problème: Connexions actives

**Erreur :**
```
database is being accessed by other users
```

**Solution :**
```sql
-- Fermer toutes les connexions
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'gestock_prod'
  AND pid <> pg_backend_pid();
```

---

## ✅ Bonnes Pratiques

### Fréquence de sauvegarde

| Environnement | Fréquence Recommandée | Raison |
|---------------|----------------------|--------|
| **Production** | Toutes les 6 heures | Équilibre entre protection et performance |
| **Pré-production** | Toutes les 12 heures | Sauvegarde régulière sans surcharge |
| **Développement** | Une fois par jour | Suffisant pour environnement de test |
| **Critique** | Toutes les 3 heures | Maximum de protection |

### Rétention des sauvegardes

```
Recommandé: 30 jours minimum
Production critique: 60-90 jours
```

### Stockage

**Local (obligatoire) :**
```
C:\gestock\backups\
```

**Distant (fortement recommandé) :**
```powershell
# Copie automatique vers NAS
$networkPath = "\\NAS\Backups\GeStock"
Copy-Item "C:\gestock\backups\*" $networkPath -Recurse -Force
```

**Cloud (optionnel) :**
- OneDrive Business
- Azure Blob Storage
- Google Drive

### Sécurité

**1. Chiffrement des sauvegardes**
```powershell
# Utiliser 7-Zip avec mot de passe
7z a -p"MotDePasseForT!" backup.7z backup.backup
```

**2. Permissions restreintes**
```powershell
# Limiter accès au dossier
icacls "C:\gestock\backups" /inheritance:r
icacls "C:\gestock\backups" /grant "Administrators:(OI)(CI)F"
icacls "C:\gestock\backups" /grant "SYSTEM:(OI)(CI)F"
```

**3. Surveillance**
```powershell
# Script de monitoring
if ((Get-Date) - (Get-Item "C:\gestock\backups\backup.log").LastWriteTime -gt [TimeSpan]::FromHours(7)) {
    Send-MailMessage -To "admin@domain.com" -Subject "⚠️  GeStock: Sauvegarde en retard"
}
```

### Tests de restauration

**Fréquence : Mensuelle**
```powershell
# 1. Créer base de test
psql -U postgres -c "CREATE DATABASE gestock_test OWNER gestock_user"

# 2. Restaurer dernière sauvegarde
$latestBackup = Get-ChildItem "C:\gestock\backups" -Recurse -Filter "*.backup" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
pg_restore -U gestock_user -d gestock_test --clean $latestBackup.FullName

# 3. Vérifier
psql -U gestock_user -d gestock_test -c "SELECT COUNT(*) FROM \"User\""

# 4. Nettoyer
psql -U postgres -c "DROP DATABASE gestock_test"
```

### Documentation

**Tenir à jour :**
1. Calendrier des sauvegardes
2. Procédures de restauration
3. Contacts en cas d'urgence
4. Historique des incidents
5. Modifications de configuration

---

## 📞 Support

### Logs importants

```
C:\gestock\backups\backup.log          # PowerShell backups
C:\gestock\logs\backup-auto.log        # Node.js auto-backup
C:\gestock\backups\restore.log         # Restaurations
```

### Commandes utiles

**Vérifier service PostgreSQL :**
```powershell
Get-Service -Name "postgresql*"
```

**Vérifier espace disque :**
```powershell
Get-PSDrive C | Select-Object Used,Free
```

**Taille dossier backups :**
```powershell
$size = (Get-ChildItem "C:\gestock\backups" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "Taille totale: $([math]::Round($size, 2)) GB"
```

---

## 📝 Changelog

### Version 1.0.0 (Décembre 2025)
- ✅ Système de sauvegarde PostgreSQL complet
- ✅ Interface admin web
- ✅ API REST backend
- ✅ Scripts PowerShell
- ✅ Sauvegarde automatique programmable
- ✅ Nettoyage automatique
- ✅ Logs détaillés
- ✅ Documentation complète

---

## 📄 Licence

GeStock - Système de Gestion de Stock
© 2025 - Tous droits réservés
