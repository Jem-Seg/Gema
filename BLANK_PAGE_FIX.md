# 🔧 Fix DÉFINITIF: Page Blanche + Erreurs 404 sur Render

## ✅ Solution appliquée

### Problème
1. **Page blanche**: Seulement logo visible
2. **Erreurs 404**: Tous les fichiers statiques JS/CSS introuvables
   ```
   Failed to load resource: 404
   - main-app-*.js
   - layout-*.js
   - page-*.js
   - *.css
   ```

### Cause racine
**`output: 'standalone'`** dans next.config.ts cause problèmes sur Render:
- Fichiers statiques non copiés au bon endroit
- Next.js cherche dans `.next/static` mais Render ne les trouve pas
- Mode standalone nécessite configuration serveur spéciale

### Solution
**Supprimer `output: 'standalone'`** et utiliser mode standard Next.js

## 📋 Changements appliqués

### 1. next.config.ts
```diff
- output: 'standalone',  // ❌ Supprimé
  reactStrictMode: true,
```

### 2. app/page.tsx
**Avant**: Redirection forcée vers /sign-in
**Après**: Page d'accueil publique avec hero + CTA

```tsx
// Affiche landing page si non authentifié
if (!user) {
  return (
    <div className="hero min-h-screen">
      <Package icon />
      <h1>GeStock</h1>
      <button>Se connecter</button>
      <button>S'inscrire</button>
    </div>
  );
}
```

### 3. render.yaml
```diff
- healthCheckPath: /api/auth/session
+ healthCheckPath: /
```

## Causes probables (ordre d'importance)

### 1. Variables environnement manquantes ❌
**Le plus probable**

Vérifier dans Render Dashboard → Environment:

```bash
# REQUIS
DATABASE_URL=postgresql://...          # ✅ Doit être Internal Database URL
NEXTAUTH_SECRET=...                    # ✅ Généré avec: openssl rand -base64 32
NEXTAUTH_URL=https://gema-l9le.onrender.com  # ⚠️ CRITIQUE - URL exacte
NODE_ENV=production                    # ✅ IMPORTANT

# OPTIONNEL (pour premier admin)
ADMIN_SECRET_KEY=...
```

### 2. NEXTAUTH_URL incorrecte
**Erreur fréquente**:
- ❌ `http://gema-l9le.onrender.com` (http au lieu de https)
- ❌ `https://gema-l9le.onrender.com/` (trailing slash)
- ✅ `https://gema-l9le.onrender.com` (correct)

### 3. DATABASE_URL incorrecte
**Erreur fréquente**:
- ❌ External Database URL (ne fonctionne pas sur Render)
- ✅ Internal Database URL (commence par `postgresql://internal...`)

## Solution appliquée dans le code

### Changement 1: Page d'accueil publique
**Avant**: Redirection automatique vers /sign-in → boucle infinie si erreur
**Après**: Page d'accueil avec boutons Se connecter / S'inscrire

```tsx
// Page publique accessible sans auth
if (!user) {
  return <LandingPage />; // Affiche hero avec CTA
}
```

### Changement 2: Redirection intelligente
**Avant**: Redirection vers /sign-in si non authentifié
**Après**: Redirection vers /dashboard si authentifié

## Étapes de correction sur Render

### Étape 1: Vérifier variables environnement
1. Render Dashboard → Votre Web Service
2. Onglet **Environment**
3. Vérifier ces 3 variables critiques:
   - `DATABASE_URL` (Internal URL)
   - `NEXTAUTH_SECRET` (32+ caractères)
   - `NEXTAUTH_URL` (https://gema-l9le.onrender.com)

### Étape 2: Corriger NEXTAUTH_URL si nécessaire
```bash
# MAUVAIS ❌
NEXTAUTH_URL=http://gema-l9le.onrender.com
NEXTAUTH_URL=https://gema-l9le.onrender.com/

# BON ✅
NEXTAUTH_URL=https://gema-l9le.onrender.com
```

### Étape 3: Redéployer
1. Sauvegarder les variables
2. Render redéploie automatiquement
3. OU: Manual Deploy → "Clear build cache & deploy"

### Étape 4: Vérifier logs
Dans **Logs** tab, chercher:

**❌ Erreurs à surveiller**:
```
Error: NEXTAUTH_SECRET or NEXTAUTH_URL is missing
PrismaClientInitializationError: Can't reach database
```

**✅ Bon fonctionnement**:
```
Server listening on port 10000
Database connected
NextAuth initialized
```

## Tests post-déploiement

### Test 1: Page d'accueil
```
URL: https://gema-l9le.onrender.com/
Attendu:
- Logo GeStock visible
- Titre "GeStock"
- Description
- Boutons "Se connecter" et "S'inscrire"
```

### Test 2: Console navigateur (F12)
**Ouvrir DevTools → Console**

❌ Si erreurs:
```
Failed to load resource: /api/auth/session (500)
NetworkError when fetching resource
```
→ Problème variables environnement

✅ Si pas d'erreurs:
→ Application fonctionne correctement

### Test 3: Sign in
```
URL: https://gema-l9le.onrender.com/sign-in
Attendu: Formulaire de connexion s'affiche
```

## Checklist diagnostic

- [ ] `DATABASE_URL` défini (Internal URL)
- [ ] `NEXTAUTH_SECRET` défini (32+ chars)
- [ ] `NEXTAUTH_URL` = `https://gema-l9le.onrender.com`
- [ ] `NODE_ENV` = `production`
- [ ] Logs Render ne montrent pas d'erreur Prisma
- [ ] Logs Render ne montrent pas d'erreur NextAuth
- [ ] Page d'accueil affiche hero + boutons
- [ ] Console navigateur sans erreurs
- [ ] `/sign-in` accessible

## Commande de diagnostic (dans Render Shell)

Si accès Shell disponible:
```bash
# Vérifier variables env
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET | wc -c  # Doit être > 30

# Tester connexion DB
npm run prisma db push --skip-generate
```

## Solution de secours

Si problème persiste après vérification variables:

1. **Clear build cache**
   - Render → Manual Deploy → "Clear build cache & deploy"

2. **Redémarrer service**
   - Render → Settings → "Suspend service"
   - Attendre 30 secondes
   - "Resume service"

3. **Recréer DATABASE_URL**
   - Copier **Internal Database URL** depuis PostgreSQL service
   - Remplacer dans Web Service Environment
   - Sauvegarder → Redéployer

## Résumé

**Problème**: Page blanche = erreur JavaScript côté client
**Cause probable**: Variables environnement manquantes ou incorrectes
**Solution code**: Page d'accueil publique (pas de redirection forcée)
**Solution config**: Vérifier NEXTAUTH_URL et DATABASE_URL sur Render

**Après correction variables + redéploiement**: Page devrait afficher hero GeStock avec boutons CTA.
