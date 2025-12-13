# 🔧 Diagnostic et Résolution Problème Authentification Render

## 🎯 Problème Identifié

**Symptômes** :
1. L'application s'ouvre brièvement sur le dashboard admin
2. Redirige immédiatement vers `/sign-in`
3. Lors de la connexion, l'URL devient `https://dashboard.render.com/web/srv-...`
4. Aucune connexion n'est établie

**Cause Probable** : Problème de configuration des cookies HTTPS avec NextAuth

## ✅ Corrections Appliquées

### 1. Configuration Cookies Sécurisés (CRITIQUE)

Ajout de la configuration explicite des cookies pour HTTPS dans `lib/auth.ts` :

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
}
```

### 2. Debug Mode Activé

```typescript
debug: true, // Activé même en production pour diagnostic
```

### 3. Endpoint de Diagnostic

Créé `/api/debug` pour vérifier :
- Variables d'environnement
- Connexion base de données
- Nombre d'utilisateurs

## 🧪 Procédure de Test (Après Déploiement)

### Étape 1 : Vérifier le Diagnostic

```bash
curl https://gema-l9le.onrender.com/api/debug
```

**Résultat Attendu** :
```json
{
  "status": "ok",
  "environment": {
    "NODE_ENV": "production",
    "NEXTAUTH_URL": "https://gema-l9le.onrender.com",
    "NEXTAUTH_SECRET": "✅ Défini",
    "DATABASE_URL": "✅ Défini"
  },
  "database": {
    "status": "✅ Connecté",
    "userCount": 1
  }
}
```

### Étape 2 : Vérifier les Cookies (Navigateur)

1. Ouvrez https://gema-l9le.onrender.com
2. Ouvrez DevTools (F12) → Onglet **Application** → **Cookies**
3. Vérifiez que vous voyez :
   - `__Secure-next-auth.session-token` (après connexion)
   - Domain : `.onrender.com` ou `gema-l9le.onrender.com`
   - Secure : ✅
   - HttpOnly : ✅

### Étape 3 : Test de Connexion

1. **Effacez tous les cookies** du site (DevTools → Application → Clear storage)
2. Rechargez la page (F5)
3. Vous devriez voir `/sign-in`
4. Connectez-vous avec identifiants admin
5. Regardez la **Console** (F12 → Console) pour les logs :
   - `🔐 Tentative de connexion`
   - `✅ Authentification réussie`
   - `✅ Session created successfully`

### Étape 4 : Vérifier les Logs Render

1. Allez sur https://dashboard.render.com
2. Service **gema-app** → **Logs**
3. Cherchez pendant la connexion :

```
✅ NextAuth URL: https://gema-l9le.onrender.com
🔐 Tentative de connexion pour: [email]
👤 Utilisateur trouvé
🔑 Vérification du mot de passe...
✅ Authentification réussie
🔑 JWT: Adding user data to token
✅ JWT: Token created successfully
📋 Session: Creating session for: [email]
✅ Session: Session created successfully
🎉 Event: User signed in: [email]
```

## 🚨 Si le Problème Persiste

### Vérification 1 : Variables d'Environnement Render

Sur https://dashboard.render.com → gema-app → Environment, vérifiez :

```
NODE_ENV=production
NEXTAUTH_URL=https://gema-l9le.onrender.com
NEXTAUTH_SECRET=[votre-secret]
DATABASE_URL=[votre-url-postgresql]
```

**IMPORTANT** : `NEXTAUTH_URL` doit être **exactement** `https://gema-l9le.onrender.com` (sans slash final)

### Vérification 2 : Cookies Bloqués

Dans le navigateur :
1. Paramètres → Confidentialité → Cookies
2. Assurez-vous que les cookies ne sont pas bloqués
3. Testez en **mode navigation privée**

### Vérification 3 : Cache Render

Si après 2-3 minutes rien ne change :

```bash
# Sur Render Dashboard
# Service gema-app → Manual Deploy → Clear build cache & deploy
```

## 📊 Commandes Utiles

### Tester l'API d'authentification

```bash
# Vérifier endpoint session
curl -I https://gema-l9le.onrender.com/api/auth/session

# Vérifier providers
curl https://gema-l9le.onrender.com/api/auth/providers

# Vérifier CSRF
curl https://gema-l9le.onrender.com/api/auth/csrf
```

### Tester avec authentification

```bash
# Simuler une connexion (remplacer EMAIL et PASSWORD)
curl -X POST https://gema-l9le.onrender.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"votre-password"}' \
  -c cookies.txt -v
```

## 🔍 Debugging Avancé

Si le problème persiste après toutes ces étapes, ajoutez un middleware de logging :

```typescript
// middleware.ts - Ajouter au début
console.log('🛡️ Middleware:', {
  pathname: request.nextUrl.pathname,
  hasToken: !!token,
  isAuthPage,
});
```

## 📝 Checklist de Résolution

- [ ] Déploiement terminé sur Render
- [ ] `/api/debug` retourne `status: "ok"`
- [ ] `NEXTAUTH_URL` correctement défini
- [ ] Cookies effacés avant test
- [ ] Console navigateur montre logs de connexion
- [ ] Logs Render montrent authentification réussie
- [ ] Cookie `__Secure-next-auth.session-token` créé
- [ ] Redirection vers `/admin/dashboard` fonctionne

## 🎯 Résultat Attendu Final

1. ✅ Ouverture de https://gema-l9le.onrender.com → redirection vers `/sign-in`
2. ✅ Connexion avec identifiants admin
3. ✅ Redirection vers `/post-sign-in`
4. ✅ Redirection finale vers `/admin/dashboard`
5. ✅ Dashboard admin s'affiche correctement
6. ✅ Navigation dans l'application fonctionne
7. ✅ Actualisation de page (F5) ne déconnecte pas

---

**Prochaine étape** : Attendez 2-3 minutes que Render déploie, puis testez avec `/api/debug` d'abord.
