# Guide Déploiement Windows - GeStock

## 📋 Prérequis

1. **Node.js 18+** installé
2. **npm** ou **yarn**
3. **PM2** (optionnel, pour production)
4. **Git** (optionnel)

## 🚀 Étapes de Déploiement

### 1. Installation des Dépendances

```cmd
cd C:\chemin\vers\gestock
npm install
```

### 2. Configuration Environnement

Créer le fichier `.env` à la racine :

```env
# Database (SQLite pour Windows)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-genere-avec-openssl

# Admin
ADMIN_SECRET_KEY=votre-cle-admin-securisee
```

**Générer un secret sécurisé** :
```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Initialiser la Base de Données

```cmd
npx prisma generate
npx prisma migrate deploy
```

### 4. Build Production

```cmd
npm run build
```

Le dossier `.next/standalone` sera créé avec l'application optimisée.

### 5. Démarrage

#### Option A: Mode Simple
```cmd
npm run start
```

#### Option B: Avec PM2 (Production)
```cmd
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 save

# Auto-démarrage Windows
pm2 startup
```

## 🔧 Configuration PM2 (ecosystem.config.js)

Le fichier `ecosystem.config.js` est déjà configuré :
- Redémarrage automatique en cas d'erreur
- Logs dans `./logs/`
- Limite mémoire: 1GB
- Port: 3000

## 📁 Structure des Fichiers

```
gestock/
├── .next/                 # Build Next.js
│   └── standalone/        # Version optimisée
├── prisma/
│   ├── schema.prisma
│   └── dev.db            # Base de données SQLite
├── public/
│   └── uploads/          # Images produits
├── logs/                 # Logs PM2 (créé auto)
├── .env                  # Configuration (à créer)
├── ecosystem.config.js   # Config PM2
└── package.json
```

## 🌐 Accès Application

Une fois démarrée, accéder à :
```
http://localhost:3000
```

## 🛠️ Commandes Utiles

### PM2
```cmd
# Voir les applications
pm2 list

# Logs en temps réel
pm2 logs gestock

# Redémarrer
pm2 restart gestock

# Arrêter
pm2 stop gestock

# Supprimer
pm2 delete gestock
```

### Application
```cmd
# Vérifier la base de données
npx prisma studio

# Migrations
npx prisma migrate dev

# Reset base (développement uniquement)
npx prisma migrate reset
```

## 🔐 Sécurité Windows

### Pare-feu
Autoriser le port 3000 :
```powershell
New-NetFirewallRule -DisplayName "GeStock" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Service Windows (Optionnel)

Pour lancer GeStock comme service Windows, utiliser **pm2-windows-service** :

```cmd
npm install -g pm2-windows-service
pm2-service-install
```

## 🐛 Dépannage

### Erreur: "Module not found"
```cmd
npm install
npx prisma generate
```

### Erreur: "Port 3000 déjà utilisé"
```cmd
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Erreur: "Database locked"
```cmd
# Arrêter tous les processus Node
taskkill /F /IM node.exe

# Redémarrer
npm run start
```

### Build échoue
```cmd
# Nettoyer le cache
rmdir /s /q .next
rmdir /s /q node_modules

# Réinstaller
npm install
npm run build
```

## 📊 Monitoring

### Logs
Les logs PM2 sont dans `./logs/` :
- `error.log` : Erreurs
- `out.log` : Sortie standard
- `combined.log` : Tout

### Performance
```cmd
# Utilisation ressources
pm2 monit

# Informations détaillées
pm2 show gestock
```

## 🔄 Mise à Jour

```cmd
# Arrêter l'application
pm2 stop gestock

# Tirer les dernières modifications (si Git)
git pull

# Installer nouvelles dépendances
npm install

# Rebuild
npm run build

# Redémarrer
pm2 restart gestock
```

## ✅ Checklist Déploiement

- [ ] Node.js 18+ installé
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` créé avec vraies valeurs
- [ ] Base de données initialisée (`prisma migrate deploy`)
- [ ] Build réussi (`npm run build`)
- [ ] Port 3000 disponible
- [ ] Pare-feu configuré (si nécessaire)
- [ ] PM2 installé et configuré
- [ ] Application démarrée et accessible
- [ ] Logs vérifiés (aucune erreur)

## 📞 Support

En cas de problème, vérifier :
1. Les logs PM2 : `pm2 logs gestock`
2. Les variables d'environnement : `.env`
3. La base de données : `npx prisma studio`
4. Le port : `netstat -ano | findstr :3000`

---

**Version** : 1.0.0  
**Dernière mise à jour** : 21 novembre 2024
