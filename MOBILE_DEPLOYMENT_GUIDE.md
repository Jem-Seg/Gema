# 📱 Guide de déploiement GeStock - Mode Mobile

## Problème identifié

L'application ne fonctionne pas correctement sur mobile en raison de configurations incorrectes pour un déploiement serveur.

## ✅ Solutions appliquées

### 1. **Optimisation du JWT callback**
- ✅ Rafraîchissement des données utilisateur toutes les 5 minutes au lieu de chaque requête
- ✅ Amélioration des performances sur mobile

### 2. **Redirection automatique vers login**
- ✅ La page d'accueil redirige automatiquement vers `/sign-in` si non authentifié
- ✅ Affichage d'un spinner pendant la redirection

### 3. **Menu mobile optimisé**
- ✅ Affichage des liens même pendant le chargement de la session
- ✅ Classe CSS corrigée (`bg-linear-to-b`)

### 4. **Page de diagnostic**
- ✅ Accès via `/mobile-test` pour diagnostiquer les problèmes

## 🚀 Configuration pour déploiement sur serveur Windows

### **CRITIQUE : Modifier le fichier `.env` sur le serveur**

```env
# Sur le serveur Windows, remplacer localhost par l'IP du serveur
NEXTAUTH_URL=http://192.168.X.X:3000  # ⚠️ Utiliser l'IP réelle du serveur
# OU pour un domaine :
# NEXTAUTH_URL=https://votre-domaine.com

NEXTAUTH_SECRET=0f0de5ed24d58fb7c7cae6c61f8e3e4ad71f3ac53fa8f2baf3f405e8bb4defa6

DATABASE_URL="file:./prisma/dev.db"

ADMIN_SECRET_KEY=admin-secure-key-nguerida-76
```

### **Étapes de déploiement**

1. **Sur le serveur Windows :**

```bash
# 1. Arrêter l'application
npm run build

# 2. Modifier .env avec l'IP du serveur
# Exemple : NEXTAUTH_URL=http://192.168.1.100:3000

# 3. Reconstruire l'application
npm run build

# 4. Démarrer en production
npm run start
```

2. **Tester depuis le mobile :**

```
# Accéder à l'application
http://192.168.X.X:3000

# Page de diagnostic
http://192.168.X.X:3000/mobile-test
```

## 🔍 Diagnostic des problèmes

### **Page de test mobile**

Accéder à `/mobile-test` depuis votre mobile pour voir :
- ✅ Status de la session
- ✅ Informations utilisateur
- ✅ Diagnostics techniques (viewport, user agent)
- ✅ Configuration réseau

### **Vérifications à faire**

1. ✅ **Session NextAuth**
   - Status: authenticated / unauthenticated / loading
   - Session active: OUI / NON

2. ✅ **Variables d'environnement**
   - `NEXTAUTH_URL` doit pointer vers l'IP du serveur
   - Protocol: http ou https
   - Host: IP ou domaine du serveur

3. ✅ **Réseau**
   - Mobile et serveur sur le même réseau local
   - Pas de pare-feu bloquant le port 3000
   - IP serveur accessible depuis le mobile

## ⚠️ Problèmes courants

### **Problème 1 : Menu ne s'affiche pas**
**Cause :** `NEXTAUTH_URL=http://localhost:3000` sur le serveur  
**Solution :** Changer en `NEXTAUTH_URL=http://IP_DU_SERVEUR:3000`

### **Problème 2 : Pas de redirection vers login**
**Cause :** Middleware ne détecte pas l'absence de session  
**Solution :** ✅ Corrigé - La page d'accueil force maintenant la redirection

### **Problème 3 : Session ne se crée pas**
**Cause :** Cookies NextAuth ne peuvent pas être définis avec `localhost`  
**Solution :** Utiliser l'IP réelle ou un domaine

### **Problème 4 : Erreur CORS / CSP**
**Cause :** NextAuth bloque les requêtes cross-origin  
**Solution :** S'assurer que `NEXTAUTH_URL` correspond exactement à l'URL d'accès

## 📋 Checklist de déploiement

- [ ] Modifier `.env` avec l'IP du serveur
- [ ] Rebuild l'application : `npm run build`
- [ ] Démarrer : `npm run start`
- [ ] Tester l'accès depuis le mobile : `http://IP:3000`
- [ ] Vérifier la page de diagnostic : `http://IP:3000/mobile-test`
- [ ] Tester la connexion
- [ ] Vérifier que le menu s'affiche
- [ ] Tester la navigation entre les pages

## 🔧 Commandes utiles

```bash
# Vérifier l'IP du serveur Windows
ipconfig

# Rebuild complet
npm run build

# Démarrer en production
npm run start

# Démarrer en développement (pour tester)
npm run dev
```

## 📞 Support

Si le problème persiste après ces corrections :

1. Accéder à `/mobile-test` et copier les diagnostics
2. Vérifier les logs du serveur
3. Vérifier que le mobile et le serveur sont sur le même réseau
4. Tester avec l'IP du serveur au lieu de localhost

---

**Date de dernière mise à jour :** 21 novembre 2025  
**Version :** 1.0
