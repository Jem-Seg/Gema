# 🚀 Guide Déploiement Production Windows - GeStock

Guide complet pour déployer GeStock sur un serveur Windows avec accès distant (desktop + mobile).

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation PostgreSQL](#installation-postgresql)
3. [Configuration Application](#configuration-application)
4. [Service Windows (NSSM + PM2)](#service-windows)
5. [Firewall Windows](#firewall-windows)
6. [Reverse Proxy](#reverse-proxy)
7. [Accès Distant](#accès-distant)
8. [SSL/HTTPS](#ssl-https)
9. [Monitoring & Logs](#monitoring--logs)
10. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### Logiciels requis

- **Windows Server 2019/2022** ou **Windows 10/11 Pro**
- **Node.js 18+** : [nodejs.org](https://nodejs.org)
- **PostgreSQL 14+** : [postgresql.org](https://www.postgresql.org/download/windows/)
- **NSSM** : [nssm.cc/download](https://nssm.cc/download)
- **Git** (optionnel) : [git-scm.com](https://git-scm.com/download/win)

### Configuration minimale

- **RAM** : 4 GB minimum, 8 GB recommandé
- **Stockage** : 10 GB disponible
- **CPU** : 2 cœurs minimum
- **Réseau** : IP statique recommandée

---

## 💾 Installation PostgreSQL

### 1. Télécharger et installer

```powershell
# Télécharger depuis: https://www.postgresql.org/download/windows/
# Installer avec Stack Builder
# Choisir mot de passe pour utilisateur 'postgres'
```

### 2. Créer la base de données

Ouvrir **pgAdmin 4** ou **SQL Shell (psql)** :

```sql
-- Créer utilisateur
CREATE USER gestock_user WITH PASSWORD 'VotreMotDePasseSecurise123!';

-- Créer base de données
CREATE DATABASE gestock_prod OWNER gestock_user;

-- Donner privilèges
GRANT ALL PRIVILEGES ON DATABASE gestock_prod TO gestock_user;
```

### 3. Vérifier connexion

```powershell
# Tester connexion
psql -U gestock_user -d gestock_prod -h localhost
```

### 4. Configuration pg_hba.conf

Fichier: `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`

```conf
# Autoriser connexions locales
host    gestock_prod    gestock_user    127.0.0.1/32    md5
host    gestock_prod    gestock_user    ::1/128         md5
```

Redémarrer PostgreSQL :

```powershell
net stop postgresql-x64-14
net start postgresql-x64-14
```

---

## ⚙️ Configuration Application

### 1. Copier les fichiers

```powershell
# Créer répertoire
mkdir C:\gestock
cd C:\gestock

# Copier projet (via USB, réseau, ou git clone)
xcopy /E /I "\\source\gestock-vf" "C:\gestock"
```

### 2. Installer dépendances

```powershell
cd C:\gestock

# Installer packages
npm install --production

# Installer PM2 globalement
npm install -g pm2
npm install -g pm2-windows-startup

# Configurer PM2 au démarrage
pm2-startup install
```

### 3. Configurer .env

Créer `C:\gestock\.env` :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://gestock_user:VotreMotDePasseSecurise123!@localhost:5432/gestock_prod"

# NextAuth
NEXTAUTH_URL="http://votre-ip-serveur:3000"
NEXTAUTH_SECRET="generer-avec-openssl-rand-base64-32"

# Environment
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
```

**Générer NEXTAUTH_SECRET** :

```powershell
# Option 1: PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Minimum 0 -Maximum 255}))

# Option 2: Si OpenSSL installé
openssl rand -base64 32
```

### 4. Modifier schema Prisma

Fichier: `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // Changer de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

### 5. Appliquer migrations

```powershell
# Générer client Prisma
npx prisma generate

# Appliquer migrations
npx prisma migrate deploy

# Vérifier tables
npx prisma studio
```

### 6. Build production

```powershell
# Build Next.js
npm run build

# Vérifier standalone
dir .next\standalone
```

### 7. Créer dossier logs

```powershell
mkdir C:\gestock\logs
```

---

## 🔄 Service Windows (NSSM + PM2)

### Option A : Installation Automatique

```powershell
# 1. Télécharger NSSM
# Extraire nssm.exe dans C:\gestock\

# 2. Exécuter script (Administrateur)
cd C:\gestock
.\install-nssm-service.bat
```

### Option B : Installation Manuelle

```powershell
# 1. Installer service
nssm install GeStock "%APPDATA%\npm\pm2.cmd" "start" "ecosystem.config.cjs"

# 2. Configurer
nssm set GeStock AppDirectory "C:\gestock"
nssm set GeStock DisplayName "GeStock - Gestion de Stock"
nssm set GeStock Start SERVICE_AUTO_START

# 3. Logs
nssm set GeStock AppStdout "C:\gestock\logs\service-output.log"
nssm set GeStock AppStderr "C:\gestock\logs\service-error.log"

# 4. Démarrer
net start GeStock
```

### Commandes service

```powershell
# Démarrer
net start GeStock

# Arrêter
net stop GeStock

# Statut
sc query GeStock

# Supprimer service
nssm remove GeStock confirm
```

### Commandes PM2

```powershell
# Lister applications
pm2 list

# Logs
pm2 logs gestock

# Monitoring
pm2 monit

# Redémarrer
pm2 restart gestock

# Sauvegarder config
pm2 save
```

---

## 🔥 Firewall Windows

### Installation Automatique

```powershell
# Exécuter script (Administrateur)
cd C:\gestock
.\configure-firewall.bat
```

### Configuration Manuelle

```powershell
# Règle HTTP entrante (port 3000)
netsh advfirewall firewall add rule name="GeStock - HTTP" dir=in action=allow protocol=TCP localport=3000

# Règle HTTPS entrante (port 443)
netsh advfirewall firewall add rule name="GeStock - HTTPS" dir=in action=allow protocol=TCP localport=443

# Autoriser Node.js
netsh advfirewall firewall add rule name="Node.js - GeStock" dir=in action=allow program="C:\Program Files\nodejs\node.exe"
```

### Vérification

```powershell
# Lister règles
netsh advfirewall firewall show rule name="GeStock - HTTP"

# Obtenir IP locale
ipconfig | findstr IPv4
```

**Test accès local** : `http://localhost:3000`

---

## 🌐 Reverse Proxy

### Option A : Nginx (Recommandé)

#### 1. Installation Nginx

```powershell
# Télécharger: http://nginx.org/en/download.html
# Extraire dans C:\nginx

cd C:\nginx
```

#### 2. Configuration

Copier `nginx.conf` fourni dans `C:\nginx\conf\nginx.conf`

**Ajuster les chemins** :

```nginx
# Ligne 62
proxy_cache_path C:/nginx/cache ...

# Ligne 110
alias C:/gestock/public/uploads/;

# Ligne 161
ssl_certificate C:/nginx/ssl/gestock.crt;
ssl_certificate_key C:/nginx/ssl/gestock.key;

# Ligne 200
alias C:/gestock/public/uploads/;
```

#### 3. Démarrer Nginx

```powershell
# Tester config
cd C:\nginx
nginx -t

# Démarrer
start nginx

# Recharger config
nginx -s reload

# Arrêter
nginx -s stop
```

#### 4. Service Windows pour Nginx

```powershell
nssm install Nginx "C:\nginx\nginx.exe"
nssm set Nginx AppDirectory "C:\nginx"
nssm set Nginx DisplayName "Nginx Reverse Proxy"
net start Nginx
```

**Accès** : `http://votre-ip` (port 80)

---

### Option B : IIS (Windows Server)

#### 1. Installer IIS

```powershell
# PowerShell Administrateur
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

#### 2. Installer modules

- **URL Rewrite** : [IIS URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
- **ARR** : [Application Request Routing](https://www.iis.net/downloads/microsoft/application-request-routing)

#### 3. Activer ARR Proxy

1. Ouvrir **IIS Manager**
2. Cliquer serveur (racine)
3. Double-clic **Application Request Routing Cache**
4. Panneau droit : **Server Proxy Settings**
5. Cocher **Enable proxy** → Appliquer

#### 4. Créer site

```powershell
# Créer répertoire
mkdir C:\inetpub\wwwroot\gestock

# Copier web.config fourni
copy iis-web.config C:\inetpub\wwwroot\gestock\web.config
```

#### 5. Configurer dans IIS

1. **Sites** → **Add Website**
2. **Site name** : GeStock
3. **Physical path** : `C:\inetpub\wwwroot\gestock`
4. **Binding** : HTTP, port 80
5. Démarrer site

**Accès** : `http://votre-ip`

---

## 📱 Accès Distant

### 1. IP Locale vs Publique

```powershell
# IP locale (réseau local)
ipconfig | findstr IPv4
# Exemple: 192.168.1.100

# IP publique (Internet)
curl ifconfig.me
# Exemple: 41.203.X.X
```

### 2. Configuration Routeur (Port Forwarding)

**Pour accès Internet** :

1. Accéder routeur : `http://192.168.1.1` (varie)
2. Connexion admin
3. Chercher **Port Forwarding** / **Virtual Server**
4. Créer règle :
   - **Service** : GeStock
   - **Port externe** : 80 (HTTP) ou 443 (HTTPS)
   - **IP interne** : 192.168.1.100 (IP serveur)
   - **Port interne** : 80 / 443
   - **Protocol** : TCP

### 3. URLs d'accès

| Contexte | URL |
|----------|-----|
| **Même PC** | `http://localhost:3000` |
| **Réseau local (desktop)** | `http://192.168.1.100` |
| **Réseau local (mobile)** | `http://192.168.1.100` |
| **Internet (avec port forwarding)** | `http://votre-ip-publique` |
| **Avec domaine + HTTPS** | `https://gestock.votredomaine.com` |

### 4. IP Statique

**Serveur Windows** :

1. **Paramètres** → **Réseau** → **Propriétés Ethernet/WiFi**
2. **Modifier** paramètres IP
3. **Manuel** :
   - IP : `192.168.1.100`
   - Masque : `255.255.255.0`
   - Passerelle : `192.168.1.1`
   - DNS : `8.8.8.8, 8.8.4.4`

### 5. DNS Dynamique (DDNS)

Si IP publique change :

- **No-IP** : [noip.com](https://www.noip.com)
- **DuckDNS** : [duckdns.org](https://www.duckdns.org)
- **DynDNS** : [dyn.com](https://dyn.com)

Permet URL fixe : `gestock.ddns.net`

---

## 🔒 SSL/HTTPS

### Option 1 : Let's Encrypt (Domaine requis)

**Avec Nginx** :

```powershell
# Installer Certbot
# https://certbot.eff.org/instructions?ws=nginx&os=windows

certbot --nginx -d gestock.votredomaine.com
```

**Avec IIS** :

- Installer **Win-ACME** : [github.com/win-acme/win-acme](https://github.com/win-acme/win-acme)

### Option 2 : Certificat Auto-signé (Dev/Test)

```powershell
# PowerShell Administrateur
New-SelfSignedCertificate -DnsName "gestock.local" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(5)

# Exporter certificat
$cert = Get-ChildItem -Path cert:\LocalMachine\My | Where-Object {$_.Subject -like "*gestock*"}
Export-Certificate -Cert $cert -FilePath "C:\nginx\ssl\gestock.crt"
```

**⚠️ Attention** : Navigateurs afficheront avertissement sécurité

### Option 3 : Certificat Commercial

- **DigiCert**, **Comodo**, **GoDaddy**
- Coût : ~50-200€/an

---

## 📊 Monitoring & Logs

### PM2 Monitoring

```powershell
# Interface interactive
pm2 monit

# Logs en temps réel
pm2 logs gestock --lines 100

# Métriques
pm2 describe gestock
```

### Logs Fichiers

| Type | Emplacement |
|------|-------------|
| **PM2 Out** | `C:\gestock\logs\pm2-out.log` |
| **PM2 Error** | `C:\gestock\logs\pm2-error.log` |
| **Service NSSM** | `C:\gestock\logs\service-output.log` |
| **Nginx Access** | `C:\nginx\logs\access.log` |
| **Nginx Error** | `C:\nginx\logs\error.log` |

### Rotation Logs

**PM2** : Installer module

```powershell
pm2 install pm2-logrotate

# Configurer
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

**Nginx** : Intégré (voir `nginx.conf`)

### Monitoring Système

**Task Manager** :

```powershell
# Ouvrir
taskmgr

# Vérifier processus "node.exe"
```

**Performance Monitor** :

```powershell
perfmon
```

---

## 🔧 Dépannage

### Problème : Application ne démarre pas

**Vérifications** :

```powershell
# 1. Service actif ?
sc query GeStock

# 2. PM2 tourne ?
pm2 list

# 3. Port occupé ?
netstat -ano | findstr :3000

# 4. Logs erreurs
pm2 logs gestock --err --lines 50
type C:\gestock\logs\pm2-error.log
```

**Solutions** :

```powershell
# Redémarrer service
net stop GeStock
net start GeStock

# Rebuild
cd C:\gestock
npm run build
pm2 restart gestock
```

---

### Problème : Erreur connexion PostgreSQL

**Erreur** : `connect ECONNREFUSED 127.0.0.1:5432`

**Vérifications** :

```powershell
# PostgreSQL actif ?
sc query postgresql-x64-14

# Port écouté ?
netstat -ano | findstr :5432

# Tester connexion
psql -U gestock_user -d gestock_prod -h localhost
```

**Solutions** :

1. Démarrer PostgreSQL :
   ```powershell
   net start postgresql-x64-14
   ```

2. Vérifier `DATABASE_URL` dans `.env`

3. Vérifier `pg_hba.conf` (autorisation MD5)

---

### Problème : Inaccessible depuis autre PC

**Vérifications** :

```powershell
# 1. Firewall règles créées ?
netsh advfirewall firewall show rule name="GeStock - HTTP"

# 2. Application écoute 0.0.0.0 ?
netstat -ano | findstr :3000

# 3. Ping serveur ?
ping 192.168.1.100
```

**Solutions** :

1. Reconfigurer firewall :
   ```powershell
   .\configure-firewall.bat
   ```

2. Vérifier `ecosystem.config.cjs` :
   ```js
   HOSTNAME: '0.0.0.0'  // Pas '127.0.0.1'
   ```

3. Désactiver temporairement firewall Windows :
   ```powershell
   netsh advfirewall set allprofiles state off
   # Tester accès
   # Réactiver : state on
   ```

---

### Problème : Erreur 502 Bad Gateway (Nginx)

**Causes** :

- Next.js pas démarré
- Mauvais port backend

**Solutions** :

```powershell
# 1. Vérifier Next.js actif
pm2 list

# 2. Vérifier nginx.conf
# upstream gestock_backend {
#     server 127.0.0.1:3000;  # Bon port ?
# }

# 3. Tester direct
curl http://localhost:3000

# 4. Logs Nginx
type C:\nginx\logs\error.log
```

---

### Problème : Upload images échoue

**Erreur** : `413 Payload Too Large`

**Solutions** :

**Nginx** :

```nginx
# nginx.conf
http {
    client_max_body_size 10M;  # Augmenter
}
```

**IIS** :

```xml
<!-- web.config -->
<requestLimits maxAllowedContentLength="10485760" />
```

**Next.js** :

```ts
// next.config.ts
experimental: {
  serverActions: {
    bodySizeLimit: '10mb'
  }
}
```

---

## ✅ Checklist Déploiement

- [ ] PostgreSQL installé et base créée
- [ ] Node.js 18+ installé
- [ ] PM2 installé globalement
- [ ] NSSM téléchargé
- [ ] Application copiée dans `C:\gestock`
- [ ] `.env` configuré avec DATABASE_URL + NEXTAUTH_SECRET
- [ ] `schema.prisma` changé en `postgresql`
- [ ] `npm install` exécuté
- [ ] `npm run build` réussi
- [ ] Migrations Prisma appliquées
- [ ] Service Windows créé et démarré
- [ ] Firewall configuré
- [ ] Reverse proxy installé (Nginx/IIS)
- [ ] Accès local fonctionne : `http://localhost:3000`
- [ ] Accès réseau local fonctionne : `http://192.168.1.X`
- [ ] Port forwarding configuré (si accès Internet)
- [ ] SSL/HTTPS configuré (production)
- [ ] Monitoring PM2 vérifié
- [ ] Logs accessibles

---

## 📞 Support

**Logs à fournir en cas de problème** :

```powershell
# Générer rapport
echo "=== PM2 Status ===" > C:\gestock\debug-report.txt
pm2 list >> C:\gestock\debug-report.txt
echo "=== PM2 Logs ===" >> C:\gestock\debug-report.txt
pm2 logs gestock --lines 50 --nostream >> C:\gestock\debug-report.txt
echo "=== Service Status ===" >> C:\gestock\debug-report.txt
sc query GeStock >> C:\gestock\debug-report.txt
echo "=== Network ===" >> C:\gestock\debug-report.txt
netstat -ano | findstr :3000 >> C:\gestock\debug-report.txt
```

---

**🎉 Votre application GeStock est maintenant accessible en production !**

- **Local** : `http://localhost:3000`
- **Réseau** : `http://[IP-SERVEUR]`
- **Internet** : `http://[IP-PUBLIQUE]` (avec port forwarding)
- **Domaine** : `https://gestock.votredomaine.com` (avec SSL)
