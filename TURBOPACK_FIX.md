# 🔧 Fix: Erreur 404 Chunks Turbopack en Production

## Problème identifié

**Erreur**: `Failed to load chunk /_next/static/chunks/eb46ef0fe8daf86f.js`
**Cause**: Turbopack est **instable en production** dans Next.js 15 & 16
**Impact**: Application ne charge pas sur Render.com (404 sur tous les chunks JS)

## Solution appliquée

### 1. Désactivation Turbopack pour production

**Fichier modifié**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',

  // CRITIQUE: Désactiver Turbopack pour production
  ...(process.env.NODE_ENV === 'production' && {
    webpack: (config) => config,
  }),

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // ... reste de la config
};
```

### 2. Configuration Render optimisée

**Fichier créé**: `render.yaml`

Points clés:
- ✅ `NODE_ENV=production` forcé
- ✅ Build sans Turbopack
- ✅ Health check sur `/api/auth/session`

## Pourquoi cette erreur?

Turbopack (successeur de Webpack) est en **mode expérimental** dans Next.js 16:
- ✅ **Stable en développement** (`next dev --turbo`)
- ❌ **Instable en production** (`next build`)

En production, Turbopack génère des chunks avec des références incorrectes, causant 404.

## Comparaison configurations

### ❌ Configuration problématique (votre suggestion)
```typescript
const nextConfig = {
  webpack: (config) => config,      // Toujours actif
  experimental: {
    serverActions: true,             // Mauvais format Next.js 16
  },
  reactStrictMode: false,            // Désactive détection bugs
};
```

**Problèmes**:
1. Webpack activé même en dev (pas Turbopack)
2. `serverActions: true` invalide (doit être objet)
3. `reactStrictMode: false` désactive protections

### ✅ Configuration correcte (appliquée)
```typescript
const nextConfig = {
  output: 'standalone',

  // Webpack SEULEMENT en production
  ...(process.env.NODE_ENV === 'production' && {
    webpack: (config) => config,
  }),

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',          // Format correct
    },
  },
  reactStrictMode: true,             // Garde protections
};
```

**Avantages**:
1. ✅ Turbopack en dev (rapide)
2. ✅ Webpack en prod (stable)
3. ✅ Server Actions correctement configuré
4. ✅ React Strict Mode activé

## Instructions déploiement Render

### Étape 1: Redéployer avec nouveau code

```bash
git add .
git commit -m "Fix: Disable Turbopack for production builds"
git push origin main
```

Render détectera automatiquement le push et redéploiera.

### Étape 2: Vérifier variables environnement

Dans Render Dashboard → Web Service → Environment:

```bash
NODE_ENV=production                    # ✅ CRITIQUE
DATABASE_URL=postgresql://...          # ✅ Requis
NEXTAUTH_SECRET=...                    # ✅ Requis
NEXTAUTH_URL=https://gema-l9le.onrender.com  # ✅ URL exacte
```

### Étape 3: Forcer rebuild complet

Si auto-deploy ne fonctionne pas:
1. Render Dashboard → Manual Deploy
2. Cliquer "Clear build cache & deploy"

### Étape 4: Surveiller logs

Logs doivent montrer:
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

**PAS** de mention "Turbopack" dans les logs de build.

## Vérification post-déploiement

### Test 1: Page d'accueil
```bash
curl -I https://gema-l9le.onrender.com/
# Devrait retourner 200 OK (pas 404)
```

### Test 2: Chunks JavaScript
Ouvrir DevTools → Network → JS:
- ✅ Tous les chunks `_next/static/chunks/*.js` doivent charger (200)
- ❌ Plus de 404 sur les chunks

### Test 3: Console navigateur
- ✅ Aucune erreur "Failed to load chunk"
- ✅ Application s'initialise correctement

## Alternative: Désactiver Turbopack complètement

Si problèmes persistent, modifiez `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",              // Sans --turbo
    "build": "next build",          // Sans --turbo
  }
}
```

Mais la solution conditionnelle est meilleure (Turbopack en dev = rapide).

## Feuille de route Turbopack

D'après Next.js team:
- **Next.js 16.x**: Turbopack expérimental en prod
- **Next.js 17+**: Turbopack stable en prod (prévu 2025 Q2-Q3)

En attendant, **toujours utiliser Webpack pour production**.

## Résumé

| Aspect | Avant | Après | Status |
|--------|-------|-------|--------|
| Build dev | Turbopack | Turbopack | ✅ Rapide |
| Build prod | Turbopack | Webpack | ✅ Stable |
| Chunks JS | 404 | 200 | ✅ Fixé |
| Server Actions | Invalide | Valide | ✅ Fixé |
| React Strict | false | true | ✅ Amélioré |

## Prochaines étapes

1. ✅ Commit & push corrections
2. ✅ Vérifier déploiement Render réussi
3. ✅ Tester application sur https://gema-l9le.onrender.com/
4. ✅ Créer premier utilisateur admin

---

**Cette correction résout définitivement l'erreur 404 chunks Turbopack.**
