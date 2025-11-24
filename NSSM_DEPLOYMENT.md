# 🚀 Déploiement NSSM - Service Windows Stable

## ⚠️ Problème PM2 en Production Windows

**Symptômes :**
- ❌ Crashs fréquents de l'application
- ❌ Service non redémarré automatiquement
- ❌ Logs non persistants après reboot
- ❌ Configuration environnement perdue

**Cause :** PM2 n'est pas optimisé pour Windows et cause des problèmes de stabilité

**Solution :** NSSM (Non-Sucking Service Manager) - Service Windows natif stable

---

## 📦 Qu'est-ce que NSSM ?

**NSSM** (Non-Sucking Service Manager) est un gestionnaire de services Windows qui :
- ✅ Transforme n'importe quelle application en **service Windows**
- ✅ **Redémarrage automatique** en cas de crash
- ✅ **Démarrage au boot** système
- ✅ **Gestion logs** avec rotation automatique
- ✅ **Variables d'environnement** persistantes
- ✅ **Interface graphique** de configuration
- ✅ **Monitoring** intégré Windows

**Comparaison PM2 vs NSSM :**

| Fonctionnalité | PM2 | NSSM |
|----------------|-----|------|
| Stabilité Windows | ⚠️ Moyenne | ✅ Excellente |
| Service Windows natif | ❌ Non | ✅ Oui |
| Auto-restart crashes | ⚠️ Parfois | ✅ Toujours |
| Démarrage auto boot | ⚠️ Complexe | ✅ Simple |
| Logs rotation | ✅ Oui | ✅ Oui |
| Interface GUI | ❌ Non | ✅ Oui |
| Config environnement | ⚠️ Volatile | ✅ Persistante |

---

## 🛠️ Installation Automatique

### **Méthode 1 : Script Automatique (RECOMMANDÉ)**

1. **Ouvrir PowerShell en Administrateur**
   - Clic droit sur menu Démarrer → "Windows PowerShell (Admin)"

2. **Naviguer vers le projet**
   ```powershell
   cd C:\chemin\vers\gema
   ```

3. **Exécuter le script d'installation**
   ```batch
   .\install-nssm-gestock.bat
   ```

4. **Suivre les instructions**
   - Le script télécharge NSSM automatiquement
   - Crée le service Windows
   - Configure les variables d'environnement
   - Demande si vous voulez démarrer immédiatement

**✅ Installation terminée en 2 minutes !**

---

### **Méthode 2 : Installation Manuelle**

#### **Étape 1 : Télécharger NSSM**
```powershell
# Télécharger NSSM 2.24
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "nssm.zip"

# Extraire
Expand-Archive -Path "nssm.zip" -DestinationPath "."

# Copier nssm.exe vers projet
copy nssm-2.24\win64\nssm.exe .
```

#### **Étape 2 : Build Production**
```bash
npm run build
```

**Vérifier :** Le fichier `.next/standalone/server.js` existe

#### **Étape 3 : Installer Service**
```batch
nssm install GeStock "C:\Program Files\nodejs\node.exe" ".next\standalone\server.js"
```

#### **Étape 4 : Configurer Service**

**Répertoire de travail :**
```batch
nssm set GeStock AppDirectory "C:\chemin\vers\gema\.next\standalone"
```

**Variables d'environnement :**
```batch
nssm set GeStock AppEnvironmentExtra ^
NODE_ENV=production ^
PORT=3000 ^
HOSTNAME=0.0.0.0 ^
DATABASE_URL=postgresql://gestock_user:PASSWORD@localhost:5432/gestock_prod ^
NEXTAUTH_URL=http://192.168.1.100:3000 ^
NEXTAUTH_SECRET=your-secret-key-here
```

**Logs :**
```batch
nssm set GeStock AppStdout "C:\chemin\vers\gema\logs\gestock-stdout.log"
nssm set GeStock AppStderr "C:\chemin\vers\gema\logs\gestock-stderr.log"
```

**Rotation logs (10 MB max) :**
```batch
nssm set GeStock AppRotateFiles 1
nssm set GeStock AppRotateOnline 1
nssm set GeStock AppRotateBytes 10485760
```

**Auto-restart :**
```batch
nssm set GeStock AppExit Default Restart
nssm set GeStock AppRestartDelay 5000
```

**Démarrage automatique :**
```batch
nssm set GeStock Start SERVICE_AUTO_START
```

#### **Étape 5 : Démarrer Service**
```batch
nssm start GeStock
```

---

## ⚙️ Configuration Variables d'Environnement

### **Variables Requises**

#### **1. PostgreSQL (DATABASE_URL)**
```batch
nssm set GeStock AppEnvironmentExtra DATABASE_URL=postgresql://gestock_user:VotreMotDePasse@localhost:5432/gestock_prod
```

**Format :** `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`

**Exemple :** `postgresql://gestock_user:SecurePass123@localhost:5432/gestock_prod`

#### **2. NextAuth URL**
```batch
nssm set GeStock AppEnvironmentExtra NEXTAUTH_URL=http://192.168.1.100:3000
```

**Remplacer :** `192.168.1.100` par **IP réelle de votre serveur**

**Trouver votre IP :**
```powershell
ipconfig | findstr IPv4
```

#### **3. NextAuth Secret**
```batch
nssm set GeStock AppEnvironmentExtra NEXTAUTH_SECRET=your-secret-key-here
```

**Générer clé sécurisée :**
```powershell
# Avec OpenSSL (si installé)
openssl rand -base64 32

# Ou avec PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Exemple :** `K7vJ2nR9pL4mT1qX8wZ5bA3fD6hN0sY2`

### **Configuration Complète en Une Commande**

```batch
nssm set GeStock AppEnvironmentExtra ^
NODE_ENV=production ^
PORT=3000 ^
HOSTNAME=0.0.0.0 ^
DATABASE_URL=postgresql://gestock_user:SecurePass123@localhost:5432/gestock_prod ^
NEXTAUTH_URL=http://192.168.1.100:3000 ^
NEXTAUTH_SECRET=K7vJ2nR9pL4mT1qX8wZ5bA3fD6hN0sY2
```

**⚠️ Remplacer :**
- `SecurePass123` → Mot de passe PostgreSQL
- `192.168.1.100` → IP serveur
- `K7vJ2nR9pL4mT1qX8wZ5bA3fD6hN0sY2` → Secret généré

---

## 🎮 Commandes NSSM

### **Gestion Service**

```batch
# Démarrer service
nssm start GeStock

# Arrêter service
nssm stop GeStock

# Redémarrer service
nssm restart GeStock

# Status service
nssm status GeStock

# Éditer configuration (GUI)
nssm edit GeStock

# Supprimer service
nssm remove GeStock confirm
```

### **Commandes Windows (sc)**

```batch
# Informations service
sc query GeStock

# Démarrer
sc start GeStock

# Arrêter
sc stop GeStock

# Configuration
sc qc GeStock
```

---

## 📊 Monitoring & Logs

### **Logs en Temps Réel**

**PowerShell :**
```powershell
Get-Content -Path ".\logs\gestock-stdout.log" -Wait -Tail 50
```

**CMD :**
```batch
powershell Get-Content -Path ".\logs\gestock-stdout.log" -Wait -Tail 50
```

### **Logs Erreurs**

```powershell
Get-Content -Path ".\logs\gestock-stderr.log" -Tail 100
```

### **Rotation Logs Automatique**

NSSM crée automatiquement de nouveaux fichiers logs quand ils atteignent 10 MB :
- `gestock-stdout.log` (actuel)
- `gestock-stdout.log.1` (rotation précédente)
- `gestock-stderr.log`
- `gestock-stderr.log.1`

### **Observateur d'Événements Windows**

1. Ouvrir **Observateur d'événements**
2. Aller dans **Journaux Windows** → **Application**
3. Filtrer par source : **GeStock**

---

## 🔥 Gestion Crashes & Auto-Restart

### **Configuration Auto-Restart**

NSSM redémarre automatiquement l'application en cas de :
- ✅ Crash Node.js
- ✅ Exception non gérée
- ✅ Erreur fatale
- ✅ Arrêt inattendu

**Configuration actuelle :**
```batch
# Toujours redémarrer en cas d'erreur
nssm set GeStock AppExit Default Restart

# Délai 5 secondes avant redémarrage
nssm set GeStock AppRestartDelay 5000
```

### **Limiter Redémarrages (Anti-Loop)**

Si l'app crash en boucle, limiter les redémarrages :

```batch
# Maximum 3 redémarrages en 10 minutes
nssm set GeStock AppThrottle 10000
```

### **Actions Personnalisées Selon Exit Code**

```batch
# Exit code 0 (succès) → Ne pas redémarrer
nssm set GeStock AppExit 0 Exit

# Exit code 1 (erreur) → Redémarrer
nssm set GeStock AppExit 1 Restart
```

---

## 🚀 Démarrage Automatique au Boot

### **Activer Démarrage Auto**

```batch
nssm set GeStock Start SERVICE_AUTO_START
```

**Types de démarrage :**
- `SERVICE_AUTO_START` : Démarrage automatique au boot
- `SERVICE_DELAYED_START` : Démarrage différé (2 min après boot)
- `SERVICE_DEMAND_START` : Démarrage manuel uniquement
- `SERVICE_DISABLED` : Service désactivé

### **Vérifier Configuration**

```batch
sc qc GeStock
```

**Résultat attendu :**
```
START_TYPE         : 2   AUTO_START
```

### **Ordre de Démarrage**

Pour que GeStock démarre **après PostgreSQL** :

1. Ouvrir Gestionnaire de services :
   ```batch
   services.msc
   ```

2. Clic droit sur **GeStock** → **Propriétés**

3. Onglet **Dépendances** → Ajouter `postgresql-x64-14` (ou votre version)

**Ou via NSSM :**
```batch
nssm set GeStock DependOnService postgresql-x64-14
```

---

## 🔐 Sécurité

### **Utilisateur Service**

Par défaut, le service tourne avec compte **SYSTEM**. Pour plus de sécurité :

1. Créer utilisateur dédié :
   ```powershell
   net user GeStockService MotDePasseSecurise /add
   net localgroup "Utilisateurs" GeStockService /add
   ```

2. Donner permissions projet :
   ```powershell
   icacls "C:\chemin\vers\gema" /grant GeStockService:(OI)(CI)F /T
   ```

3. Configurer service :
   ```batch
   nssm set GeStock ObjectName .\GeStockService MotDePasseSecurise
   ```

### **Firewall Windows**

Autoriser port 3000 :

```powershell
# PowerShell Admin
New-NetFirewallRule -DisplayName "GeStock HTTP" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Vérifier :**
```powershell
Get-NetFirewallRule -DisplayName "GeStock HTTP"
```

---

## 🧪 Tests & Validation

### **1. Test Service Local**

```batch
# Démarrer service
nssm start GeStock

# Attendre 10 secondes
timeout /t 10

# Vérifier status
nssm status GeStock
```

**Résultat attendu :** `SERVICE_RUNNING`

### **2. Test HTTP**

**PowerShell :**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

**Navigateur :** http://localhost:3000

### **3. Test Réseau Distant**

**Depuis autre PC même réseau :**
```
http://192.168.1.100:3000
```

**Trouver IP serveur :**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
```

### **4. Test Auto-Restart**

**Simuler crash :**
```batch
# Tuer processus Node
taskkill /F /IM node.exe

# Attendre 10 secondes
timeout /t 10

# Vérifier redémarrage
nssm status GeStock
```

**Résultat attendu :** Service redémarré automatiquement

### **5. Test Reboot Serveur**

```powershell
# Redémarrer serveur
shutdown /r /t 60

# Après reboot, vérifier service
nssm status GeStock
```

**Résultat attendu :** Service démarré automatiquement

---

## 🔧 Dépannage

### **Problème : Service ne démarre pas**

**1. Vérifier logs erreurs :**
```powershell
Get-Content -Path ".\logs\gestock-stderr.log" -Tail 50
```

**2. Vérifier build standalone existe :**
```powershell
Test-Path ".next\standalone\server.js"
```

Si `False` :
```bash
npm run build
```

**3. Vérifier Node.js path :**
```powershell
nssm get GeStock Application
```

Doit retourner : `C:\Program Files\nodejs\node.exe`

**4. Test manuel :**
```powershell
cd .next\standalone
node server.js
```

Si erreur → Corriger avant NSSM

### **Problème : Variables d'environnement non prises en compte**

**1. Vérifier config :**
```batch
nssm get GeStock AppEnvironmentExtra
```

**2. Reconfigurer :**
```batch
nssm set GeStock AppEnvironmentExtra ^
NODE_ENV=production ^
DATABASE_URL=postgresql://...
```

**3. Redémarrer :**
```batch
nssm restart GeStock
```

### **Problème : Logs vides**

**1. Vérifier dossier logs existe :**
```powershell
mkdir logs -Force
```

**2. Permissions écriture :**
```powershell
icacls logs /grant Everyone:(OI)(CI)F
```

**3. Reconfigurer logs NSSM :**
```batch
nssm set GeStock AppStdout "%CD%\logs\gestock-stdout.log"
nssm set GeStock AppStderr "%CD%\logs\gestock-stderr.log"
```

### **Problème : Port 3000 déjà utilisé**

**1. Trouver processus :**
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
```

**2. Identifier application :**
```powershell
Get-Process -Id [PID]
```

**3. Tuer processus :**
```powershell
Stop-Process -Id [PID] -Force
```

### **Problème : PostgreSQL connexion refusée**

**1. Vérifier PostgreSQL actif :**
```powershell
Get-Service postgresql*
```

**2. Démarrer si arrêté :**
```powershell
Start-Service postgresql-x64-14
```

**3. Vérifier DATABASE_URL :**
```batch
nssm get GeStock AppEnvironmentExtra
```

**4. Tester connexion manuellement :**
```powershell
psql -U gestock_user -d gestock_prod -h localhost
```

---

## 📋 Checklist Déploiement Production

### **Pré-Déploiement**
- [ ] PostgreSQL installé et running
- [ ] Base de données `gestock_prod` créée
- [ ] User PostgreSQL `gestock_user` créé avec permissions
- [ ] Node.js installé (v18+ recommandé)
- [ ] Projet cloné sur serveur
- [ ] `npm install` exécuté

### **Configuration**
- [ ] `.env` ou variables NSSM configurées
- [ ] `DATABASE_URL` avec mot de passe correct
- [ ] `NEXTAUTH_URL` avec IP serveur réelle
- [ ] `NEXTAUTH_SECRET` généré (32+ caractères)
- [ ] `npm run build` réussi
- [ ] `.next/standalone/server.js` existe

### **NSSM Installation**
- [ ] `nssm.exe` téléchargé
- [ ] Service créé : `nssm install GeStock`
- [ ] Variables environnement configurées
- [ ] Logs configurés (`AppStdout`, `AppStderr`)
- [ ] Auto-restart configuré
- [ ] Démarrage automatique activé

### **Tests**
- [ ] Service démarre : `nssm start GeStock`
- [ ] Status OK : `nssm status GeStock`
- [ ] Logs stdout générés
- [ ] Application accessible : http://localhost:3000
- [ ] Connexion réseau distante fonctionne
- [ ] Auto-restart testé (kill node.exe)
- [ ] Reboot serveur testé

### **Sécurité**
- [ ] Firewall port 3000 ouvert
- [ ] Mots de passe forts (PostgreSQL, NEXTAUTH_SECRET)
- [ ] Utilisateur service dédié (optionnel)
- [ ] Permissions fichiers correctes

### **Monitoring**
- [ ] Logs rotation activée (10 MB)
- [ ] Observateur événements configuré
- [ ] Script monitoring créé (optionnel)

---

## 🎯 Scripts Utiles

### **start-production-nssm.bat**

Script déjà inclus pour démarrage rapide :

```batch
@echo off
set SERVICE_NAME=GeStock

REM Démarrage service
nssm start %SERVICE_NAME%

echo [OK] Service GeStock demarre
echo Application : http://localhost:3000
pause
```

**Utilisation :**
```batch
.\start-production-nssm.bat
```

### **stop-production.bat**

```batch
@echo off
nssm stop GeStock
echo [OK] Service GeStock arrete
pause
```

### **restart-production.bat**

```batch
@echo off
nssm restart GeStock
echo [OK] Service GeStock redémarre
pause
```

### **status-production.bat**

```batch
@echo off
echo Status Service :
nssm status GeStock
echo.
echo Processus Node :
tasklist | findstr node.exe
echo.
echo Port 3000 :
netstat -ano | findstr :3000
pause
```

---

## 📚 Ressources

- **NSSM Documentation** : https://nssm.cc/usage
- **NSSM Download** : https://nssm.cc/download
- **Next.js Standalone** : https://nextjs.org/docs/advanced-features/output-file-tracing
- **Windows Services** : https://learn.microsoft.com/windows-server/administration/windows-commands/sc-config

---

## 🎉 Résumé

| Élément | PM2 | NSSM |
|---------|-----|------|
| **Stabilité Windows** | ⚠️ | ✅ |
| **Service natif** | ❌ | ✅ |
| **Auto-restart** | ⚠️ | ✅ |
| **Démarrage boot** | ⚠️ | ✅ |
| **Logs rotation** | ✅ | ✅ |
| **GUI configuration** | ❌ | ✅ |
| **Variables env** | ⚠️ | ✅ |

**NSSM = Solution production Windows recommandée ! 🚀**

---

## ⏭️ Prochaines Étapes

1. ✅ Migrer Tailwind V4 → V3 (`TAILWIND_V3_MIGRATION.md`)
2. ✅ Installer NSSM (`install-nssm-gestock.bat`)
3. ⏭️ Configurer PostgreSQL production
4. ⏭️ Configurer sauvegarde automatique (`BACKUP_RECOVERY_GUIDE.md`)
5. ⏭️ Configurer reverse proxy Nginx/IIS (`DEPLOYMENT_GUIDE.md`)
