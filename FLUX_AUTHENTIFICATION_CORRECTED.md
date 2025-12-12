# Flux d'Authentification Corrigé

## 📋 Vue d'Ensemble

Ce document décrit le flux d'authentification corrigé qui distingue clairement les parcours admin et non-admin.

---

## 🔐 Flux d'Inscription

### Scénario 1 : Premier utilisateur (Admin)
1. Utilisateur visite `/sign-up`
2. Système détecte qu'il n'y a aucun utilisateur en base
3. Affiche un champ "Clé d'administration" (requis)
4. Utilisateur entre ses informations + clé admin secrète
5. **API `/api/auth/register` :**
   - Vérifie la clé admin contre `process.env.ADMIN_SECRET_KEY`
   - Crée l'utilisateur avec `isAdmin: true` et `isApproved: true`
6. Message : "Compte administrateur créé avec succès"
7. Redirection vers `/sign-in`

### Scénario 2 : Utilisateurs suivants (Non-admin)
1. Utilisateur visite `/sign-up`
2. Système détecte qu'il y a déjà des utilisateurs
3. Formulaire standard (pas de champ clé admin)
4. **API `/api/auth/register` :**
   - Crée l'utilisateur avec `isAdmin: false` et `isApproved: false`
5. Message : "Inscription réussie ! Votre compte sera activé après validation"
6. Redirection vers `/sign-in`

---

## 🚪 Flux de Connexion

### Scénario A : Admin se connecte

```
/sign-in
   ↓ (credentials valides)
NextAuth valide (lib/auth.ts)
   ↓
/post-sign-in
   ↓ (détecte isAdmin = true)
/admin/dashboard ✅
```

**Étapes détaillées :**
1. Admin entre email/password sur `/sign-in`
2. NextAuth vérifie les credentials
3. Token JWT créé avec `isAdmin: true`, `isApproved: true`
4. Redirection vers `/post-sign-in`
5. **`post-sign-in/page.tsx` détecte `isAdmin = true`**
6. Redirige directement vers `/admin/dashboard`
7. Admin voit le tableau de bord administrateur

### Scénario B : Non-admin non approuvé se connecte

```
/sign-in
   ↓ (credentials valides)
NextAuth valide (lib/auth.ts)
   ↓
/post-sign-in
   ↓ (détecte isAdmin = false)
/ (homepage)
   ↓ (détecte isApproved = false OU roleId = null)
Affiche "En attente d'approbation" ⏳
```

**Étapes détaillées :**
1. Utilisateur entre email/password sur `/sign-in`
2. NextAuth vérifie les credentials
3. Token JWT créé avec `isAdmin: false`, `isApproved: false`
4. Redirection vers `/post-sign-in`
5. **`post-sign-in/page.tsx` détecte `isAdmin = false`**
6. Redirige vers `/` (homepage)
7. **`app/page.tsx` charge les données utilisateur**
8. Détecte `needsApproval = true` (car `isApproved = false` OU `roleId = null`)
9. Affiche la page "Compte en attente d'approbation" avec :
   - Message explicatif
   - Liste des actions requises (approbation, attribution rôle, rattachement ministère)
   - Informations du compte
   - Bouton "Se déconnecter"

### Scénario C : Non-admin approuvé avec rôle se connecte

```
/sign-in
   ↓ (credentials valides)
NextAuth valide (lib/auth.ts)
   ↓
/post-sign-in
   ↓ (détecte isAdmin = false)
/ (homepage)
   ↓ (détecte isApproved = true ET roleId ≠ null)
/dashboard ✅
```

**Étapes détaillées :**
1. Utilisateur entre email/password sur `/sign-in`
2. NextAuth vérifie les credentials
3. Token JWT créé avec `isAdmin: false`, `isApproved: true`, `roleId: "xxx"`
4. Redirection vers `/post-sign-in`
5. **`post-sign-in/page.tsx` détecte `isAdmin = false`**
6. Redirige vers `/` (homepage)
7. **`app/page.tsx` charge les données utilisateur**
8. Détecte `needsApproval = false` (car `isApproved = true` ET `roleId ≠ null`)
9. **`useEffect` détecte `!isAdmin` ET `!needsApproval`**
10. Redirige automatiquement vers `/dashboard`
11. Utilisateur voit son tableau de bord avec ses permissions

---

## 🛡️ Protection des Routes

### Middleware (`middleware.ts`)

**Routes publiques :**
- `/sign-in`
- `/sign-up`
- `/reset-password`
- `/` (homepage)
- `/post-sign-in`

**Routes protégées (nécessitent token) :**
- `/dashboard` → Nécessite `isApproved = true` ET `roleId ≠ null`
- `/category`
- `/products`
- `/alimentations`
- `/octrois`
- `/transactions`
- `/new-product`
- `/update-product`
- `/give`

**Routes admin (nécessitent `isAdmin = true`) :**
- `/admin/dashboard`
- `/admin/users`
- `/admin/roles`
- `/admin/ministeres`
- `/admin/structures`
- `/admin/settings`

**Logique middleware :**
```typescript
if (!token && !isPublicPage) {
  // Pas de token → rediriger vers /sign-in
  return redirect('/sign-in')
}

if (token && isAuthPage) {
  // Déjà connecté sur page auth → rediriger vers /post-sign-in
  return redirect('/post-sign-in')
}

if (token && isProtectedRoute && !isAdmin) {
  // Route protégée pour non-admin
  if (!isApproved || !hasRole) {
    // Pas approuvé ou pas de rôle → bloquer accès
    return redirect('/')
  }
}
```

---

## 🔄 Processus d'Approbation Admin

### Étapes pour qu'un utilisateur non-admin accède au système

1. **Inscription** : Utilisateur crée son compte → `isApproved: false`, `roleId: null`

2. **Connexion initiale** : 
   - Connexion réussie
   - Redirection vers homepage
   - Message "En attente d'approbation"

3. **Admin approuve** (`/admin/users`) :
   - Admin voit l'utilisateur en attente
   - Coche "Approuver"
   - `isApproved: true` en base de données

4. **Admin attribue un rôle** :
   - Admin sélectionne un rôle (Gestionnaire, Agent de saisie, etc.)
   - `roleId: "xxx"` en base de données

5. **Admin rattache à un ministère** :
   - Admin sélectionne le ministère
   - `ministereId: "yyy"` en base de données

6. **Prochaine connexion utilisateur** :
   - Token rafraîchi avec `isApproved: true` et `roleId: "xxx"`
   - Détection : utilisateur complet
   - Redirection automatique vers `/dashboard` ✅

---

## 📊 Conditions de Redirection

### Tableau récapitulatif

| isAdmin | isApproved | roleId | Destination après connexion |
|---------|------------|--------|----------------------------|
| `true`  | `true`     | N/A    | `/admin/dashboard` ✅       |
| `false` | `false`    | `null` | `/` → Page "En attente" ⏳  |
| `false` | `true`     | `null` | `/` → Page "En attente" ⏳  |
| `false` | `false`    | `xxx`  | `/` → Page "En attente" ⏳  |
| `false` | `true`     | `xxx`  | `/` → `/dashboard` ✅       |

**Formule `needsApproval` :**
```typescript
needsApproval = !isApproved || !roleId
```

---

## 🔧 Fichiers Modifiés

### 1. `/app/post-sign-in/page.tsx`

**Changement clé :**
```typescript
// AVANT : Tout le monde vers /
if (status === 'authenticated') {
  router.push('/');
}

// APRÈS : Admin vers /admin/dashboard, autres vers /
if (status === 'authenticated' && session?.user) {
  const isAdmin = (session.user as any).isAdmin;
  
  if (isAdmin) {
    router.push('/admin/dashboard');
  } else {
    router.push('/');
  }
}
```

### 2. `/app/page.tsx`

**Changement clé :**
```typescript
// AVANT : Tout le monde approuvé vers /dashboard
useEffect(() => {
  if (status === 'authenticated' && userStatus && !userStatus.needsApproval) {
    router.push('/dashboard');
  }
}, [status, userStatus, router]);

// APRÈS : Seulement non-admin approuvés vers /dashboard
useEffect(() => {
  if (status === 'authenticated' && userStatus && !userStatus.needsApproval) {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }
}, [status, userStatus, router, isAdmin]);
```

---

## ✅ Tests de Vérification

### Test 1 : Premier utilisateur (Admin)
1. ✅ Inscription avec clé admin
2. ✅ Connexion réussie
3. ✅ Redirection vers `/admin/dashboard`
4. ✅ Accès à toutes les fonctions admin

### Test 2 : Utilisateur non-admin, non approuvé
1. ✅ Inscription sans clé admin
2. ✅ Connexion réussie
3. ✅ Redirection vers `/` (homepage)
4. ✅ Message "En attente d'approbation" affiché
5. ✅ Pas d'accès aux routes protégées

### Test 3 : Utilisateur non-admin, approuvé avec rôle
1. ✅ Admin approuve et attribue rôle
2. ✅ Utilisateur se connecte
3. ✅ Redirection vers `/` puis automatique vers `/dashboard`
4. ✅ Accès aux fonctionnalités selon permissions

### Test 4 : Admin visite la homepage
1. ✅ Admin connecté visite `/`
2. ✅ Pas de redirection automatique (peut voir la homepage)
3. ✅ Peut manuellement aller sur `/admin/dashboard`

---

## 🐛 Problèmes Corrigés

### Problème 1 : Admin redirigé vers `/dashboard` au lieu de `/admin/dashboard`
**Cause :** `post-sign-in/page.tsx` envoyait tout le monde vers `/`  
**Solution :** Détection de `isAdmin` dans `post-sign-in` pour rediriger vers `/admin/dashboard`

### Problème 2 : Admin redirigé automatiquement depuis homepage
**Cause :** `app/page.tsx` redirigeait tous les utilisateurs approuvés vers `/dashboard`  
**Solution :** Ajout condition `!isAdmin` pour ne rediriger que les non-admins

### Problème 3 : Utilisateurs non approuvés accédaient au dashboard
**Cause :** Vérification incomplète de `roleId` dans la condition  
**Solution :** Formule `needsApproval = !isApproved || !roleId` vérifie les deux

---

## 📝 Notes Importantes

1. **Token JWT rafraîchi toutes les 5 minutes** dans `lib/auth.ts` pour récupérer les changements d'approbation/rôle
2. **Middleware protège toutes les routes** sauf celles explicitement publiques
3. **Admin a toujours accès** à toutes les routes protégées, même sans `roleId`
4. **Page homepage (`/`)** sert de hub de redirection et de page "En attente"
5. **`post-sign-in`** est une page intermédiaire temporaire pour gérer la redirection post-connexion

---

## 🎯 Flux Final Simplifié

```
┌─────────────┐
│  /sign-up   │ → Inscription
└──────┬──────┘
       │
       ├── Premier user → isAdmin: true, isApproved: true
       └── Autres users → isAdmin: false, isApproved: false
       │
       ↓
┌─────────────┐
│  /sign-in   │ → Connexion
└──────┬──────┘
       │
       ↓
┌──────────────┐
│ /post-sign-in│ → Détection type user
└──────┬───────┘
       │
       ├── isAdmin = true ──→ /admin/dashboard ✅
       │
       └── isAdmin = false ──→ / (homepage)
                               │
                               ├── needsApproval = true ──→ Page "En attente" ⏳
                               │
                               └── needsApproval = false ──→ /dashboard ✅
```

---

**Date de mise à jour :** 12 décembre 2025  
**Version :** 1.0 (Corrigé)
