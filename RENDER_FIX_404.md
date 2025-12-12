# 🚨 CORRECTION RENDER - FICHIERS STATIQUES 404

## Problème
Tous les fichiers JS et CSS retournent 404 sur Render malgré Start Command correct.

## Vérifications CRITIQUES

### ⚠️ IMPORTANT : Render Dashboard vs render.yaml

**Render utilise les settings du Dashboard en PRIORITÉ** si vous avez modifié manuellement les commandes.

### 1. Vérifier Build Command dans Render Dashboard

Allez sur : https://dashboard.render.com → Votre service → **Settings**

**Build & Deploy** → **Build Command** doit être :
```bash
chmod +x build.sh && ./build.sh
```

**PAS** :
- ~~`npm install && npm run build`~~
- ~~`npm run build`~~

### 2. Vérifier Start Command dans Render Dashboard

**Build & Deploy** → **Start Command** doit être **EXACTEMENT** :
```bash
cd .next/standalone && node server.js
```

**PAS** :
- ~~`node .next/standalone/server.js`~~ ❌
- ~~`npm start`~~ ❌
- ~~`node server.js`~~ ❌

### 3. Supprimer les Overrides (si présents)

Si vous voyez un message comme :
> "This setting overrides render.yaml"

Cliquez sur **"Clear"** ou **"Use render.yaml"** pour revenir à la configuration du fichier.

## Solution IMMÉDIATE

### Option A : Utiliser render.yaml (RECOMMANDÉ)

1. Dans Render Dashboard → Settings
2. **Build Command** : Cliquez "Clear" → laissez vide ou cliquez "Use render.yaml"
3. **Start Command** : Cliquez "Clear" → laissez vide ou cliquez "Use render.yaml"  
4. Save Changes
5. **Manual Deploy**

### Option B : Configuration manuelle

Si vous préférez ne pas utiliser render.yaml :

1. **Build Command** :
   ```bash
   chmod +x build.sh && ./build.sh
   ```

2. **Start Command** :
   ```bash
   cd .next/standalone && node server.js
   ```

3. Save Changes
4. **Manual Deploy**

## Diagnostic des Logs de Build

Après le déploiement, vérifiez les **logs de build** Render pour cette section :

```
========================================
🔍 FINAL BUILD DIAGNOSTIC
========================================
Working directory: /opt/render/project/src
Static chunks: 114
CSS files: 2
BUILD_ID: [un hash]
Static dir: EXISTS ✅

Sample files in static/chunks:
.next/standalone/.next/static/chunks/1517-xxx.js
.next/standalone/.next/static/chunks/4046-xxx.js
.next/standalone/.next/static/chunks/4bd1b696-xxx.js
========================================
```

**Si vous voyez** :
- `Static chunks: 0` → Le build n'a pas fonctionné
- `Static dir: MISSING ❌` → La copie a échoué
- `Sample files: No JS files found` → Problème de copie

**Si tout est OK dans les logs** mais 404 persiste → Le Start Command est incorrect.

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
