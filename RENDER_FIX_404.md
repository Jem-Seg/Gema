# 🚨 CORRECTION RENDER - FICHIERS STATIQUES 404

## Problème
Tous les fichiers JS et CSS retournent 404 sur Render.

## Cause Racine
Le **Start Command dans Render Dashboard** ne correspond pas à la configuration nécessaire pour le mode standalone.

## Solution IMMÉDIATE

### 1. Dans Render Dashboard

Allez sur : https://dashboard.render.com/web/YOUR_SERVICE

Puis : **Settings** → **Build & Deploy** → **Start Command**

Changez de :
```bash
node .next/standalone/server.js
```

À :
```bash
cd .next/standalone && node server.js
```

### 2. Pourquoi ce changement ?

Le serveur Next.js standalone DOIT s'exécuter depuis son propre répertoire (`.next/standalone/`) pour que les chemins relatifs vers `./next/static/` fonctionnent correctement.

Quand vous exécutez `node .next/standalone/server.js` depuis la racine, le serveur cherche les fichiers statiques au mauvais endroit.

## Vérification Après Déploiement

1. **Redéployez** depuis Render Dashboard (Manual Deploy)
2. Ouvrez https://gema-l9le.onrender.com
3. **DevTools Console** ne devrait plus afficher de 404
4. **Network tab** : tous les fichiers `*.js` et `*.css` doivent être 200 OK

## Build Command (déjà correct)

```bash
chmod +x build.sh && ./build.sh
```

Ce script :
- ✅ Build Next.js en mode standalone
- ✅ Copie `.next/static/` → `.next/standalone/.next/static/`  
- ✅ Copie `public/` → `.next/standalone/public/`
- ✅ Affiche un diagnostic des fichiers copiés

## Variables d'Environnement Requises

Vérifiez dans Render Settings → Environment :

- `NODE_ENV` = `production`
- `PORT` = `10000`
- `DATABASE_URL` = [votre PostgreSQL URL]
- `NEXTAUTH_SECRET` = [secret 32+ caractères]
- `NEXTAUTH_URL` = `https://gema-l9le.onrender.com`

## Test Local du Serveur Standalone

Pour reproduire localement :

```bash
cd .next/standalone
PORT=3001 node server.js
```

Puis testez : http://localhost:3001

Les fichiers statiques DOIVENT être accessibles à :
- http://localhost:3001/_next/static/chunks/*.js
- http://localhost:3001/_next/static/css/*.css

## Si le Problème Persiste

Vérifiez les **logs de build Render** pour cette ligne :

```
🔍 Build Diagnostic:
   Static chunks: 114
   CSS files: 2
```

Si les chunks = 0, le problème est dans le build.
Si les chunks > 0, le problème est dans le Start Command.
