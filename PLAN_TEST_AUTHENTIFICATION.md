# Plan de Test - Flux d'Authentification

## 🎯 Objectif
Valider que le système respecte bien le processus suivant :
- **Utilisateur non-admin non approuvé** → Page "En attente d'approbation"
- **Utilisateur non-admin approuvé avec rôle** → Dashboard utilisateur `/dashboard`
- **Utilisateur admin** → Dashboard admin `/admin/dashboard`

---

## ✅ Checklist de Tests

### Test 1 : Premier Utilisateur (Admin Initial)

**Pré-requis :** Base de données vide ou pas d'utilisateurs

**Étapes :**
1. [ ] Accéder à `/sign-up`
2. [ ] Vérifier que le message "Aucun utilisateur détecté. Créez le premier compte administrateur" s'affiche
3. [ ] Vérifier que le champ "Clé d'administration" est présent et requis
4. [ ] Remplir le formulaire avec :
   - Prénom : "Admin"
   - Nom : "Système"
   - Email : "admin@gestock.mr"
   - Password : "AdminPass123!"
   - Clé admin : `[Votre ADMIN_SECRET_KEY depuis .env]`
5. [ ] Cliquer sur "S'inscrire"
6. [ ] Vérifier le message : "Compte administrateur créé avec succès"
7. [ ] Vérifier la redirection vers `/sign-in`

**Test de connexion admin :**
8. [ ] Se connecter avec les credentials admin
9. [ ] Vérifier le message : "Connexion réussie"
10. [ ] **Vérifier la redirection vers `/admin/dashboard`** ✅
11. [ ] Vérifier l'accès aux menus admin :
    - [ ] Utilisateurs
    - [ ] Rôles
    - [ ] Ministères
    - [ ] Structures
    - [ ] Paramètres
12. [ ] Vérifier que le badge "Admin" s'affiche dans l'interface

**Résultat attendu :** ✅ Admin créé et redirigé vers son dashboard admin

---

### Test 2 : Inscription Utilisateur Non-Admin

**Pré-requis :** Au moins un utilisateur existe en base (l'admin du Test 1)

**Étapes :**
1. [ ] Se déconnecter (si connecté en tant qu'admin)
2. [ ] Accéder à `/sign-up`
3. [ ] Vérifier que le champ "Clé d'administration" n'est PAS affiché
4. [ ] Vérifier que le titre est "Inscription" (pas "Créer le compte administrateur")
5. [ ] Remplir le formulaire avec :
   - Prénom : "Jean"
   - Nom : "Dupont"
   - Email : "jean.dupont@ministere.mr"
   - Password : "UserPass123!"
6. [ ] Cliquer sur "S'inscrire"
7. [ ] Vérifier le message : "Inscription réussie ! Votre compte sera activé après validation"
8. [ ] Vérifier la redirection vers `/sign-in`

**Vérification en base de données :**
9. [ ] Vérifier que l'utilisateur existe avec :
   - `isAdmin: false`
   - `isApproved: false`
   - `roleId: null`

**Résultat attendu :** ✅ Utilisateur créé mais non approuvé

---

### Test 3 : Connexion Utilisateur Non-Admin Non Approuvé

**Pré-requis :** Utilisateur non-admin créé (Test 2) mais pas encore approuvé par l'admin

**Étapes :**
1. [ ] Accéder à `/sign-in`
2. [ ] Se connecter avec :
   - Email : "jean.dupont@ministere.mr"
   - Password : "UserPass123!"
3. [ ] Vérifier le message : "Connexion réussie"
4. [ ] **Vérifier la redirection vers `/` (homepage)** ✅
5. [ ] **Vérifier l'affichage de la page "En attente d'approbation"** ✅

**Contenu de la page d'attente :**
6. [ ] Vérifier le titre : "Compte en attente d'approbation"
7. [ ] Vérifier le message : "Votre compte a été créé avec succès. Un administrateur doit maintenant :"
8. [ ] Vérifier la liste des actions requises :
   - [ ] "Approuver votre compte"
   - [ ] "Vous attribuer un rôle"
   - [ ] "Vous rattacher à un ministère"
9. [ ] Vérifier la carte "Informations de votre compte" avec :
   - Email : "jean.dupont@ministere.mr"
   - Nom : "Dupont Jean"
   - Statut : "En attente d'approbation"

**Test d'accès aux routes protégées :**
10. [ ] Tenter d'accéder à `/dashboard` directement dans l'URL
11. [ ] **Vérifier la redirection vers `/` (homepage)** ✅ (blocage par middleware)
12. [ ] Tenter d'accéder à `/products`
13. [ ] **Vérifier la redirection vers `/` (homepage)** ✅
14. [ ] Tenter d'accéder à `/admin/dashboard`
15. [ ] **Vérifier la redirection vers `/sign-in`** ✅ (pas admin)

**Résultat attendu :** ✅ Utilisateur bloqué sur page d'attente, aucun accès aux fonctionnalités

---

### Test 4 : Approbation par l'Admin

**Pré-requis :** 
- Admin connecté
- Utilisateur non-admin en attente (Test 3)

**Étapes côté admin :**
1. [ ] Se connecter en tant qu'admin
2. [ ] Accéder à `/admin/users`
3. [ ] Vérifier que "Jean Dupont" apparaît dans la liste avec :
   - Badge "En attente"
   - `isApproved: false`
   - `roleId: null`
4. [ ] Cliquer sur "Modifier" pour l'utilisateur Jean Dupont
5. [ ] Cocher "Approuver l'utilisateur"
6. [ ] Sélectionner un rôle (ex : "Agent de saisie")
7. [ ] Sélectionner un ministère (ex : "Ministère de la Santé")
8. [ ] Sélectionner une structure (si applicable)
9. [ ] Cliquer sur "Enregistrer"
10. [ ] Vérifier le message de succès

**Vérification en base de données :**
11. [ ] Vérifier que l'utilisateur a maintenant :
   - `isApproved: true`
   - `roleId: [ID du rôle sélectionné]`
   - `ministereId: [ID du ministère]`

**Résultat attendu :** ✅ Utilisateur approuvé et rôle attribué

---

### Test 5 : Connexion Utilisateur Non-Admin Approuvé

**Pré-requis :** Utilisateur approuvé avec rôle (Test 4)

**Étapes :**
1. [ ] Se déconnecter (si connecté en tant qu'admin)
2. [ ] Accéder à `/sign-in`
3. [ ] Se connecter avec :
   - Email : "jean.dupont@ministere.mr"
   - Password : "UserPass123!"
4. [ ] Vérifier le message : "Connexion réussie"
5. [ ] **Vérifier la redirection vers `/post-sign-in`** ✅
6. [ ] **Vérifier ensuite la redirection vers `/` (homepage)** ✅
7. [ ] **Vérifier enfin la redirection automatique vers `/dashboard`** ✅

**Contenu du dashboard utilisateur :**
8. [ ] Vérifier l'affichage du nom : "Bienvenue, Jean"
9. [ ] Vérifier l'affichage du rôle : "Agent de saisie" (ou rôle attribué)
10. [ ] Vérifier l'affichage du ministère : "Ministère de la Santé"
11. [ ] Vérifier la présence des widgets du dashboard :
    - [ ] Statistiques (si permissions lecture)
    - [ ] Vue d'ensemble des produits
    - [ ] Graphiques de catégories
    - [ ] Transactions récentes

**Test des permissions selon le rôle :**
12. [ ] Si "Agent de saisie" → Vérifier accès à :
    - [ ] `/alimentations` (création alimentations)
    - [ ] `/products` (visualisation uniquement)
13. [ ] Si "Gestionnaire" → Vérifier accès à :
    - [ ] `/alimentations` (création alimentations)
    - [ ] `/octrois` (création octrois)
    - [ ] `/products` (création/modification produits)

**Test de navigation :**
14. [ ] Cliquer sur "Stock" dans la navbar
15. [ ] Vérifier l'affichage du modal de stock
16. [ ] Cliquer sur "Alimentation" dans la navbar (si permissions)
17. [ ] Vérifier l'accès à la page d'alimentation

**Résultat attendu :** ✅ Utilisateur approuvé accède au dashboard et aux fonctionnalités selon son rôle

---

### Test 6 : Déconnexion et Reconnexion

**Test persistance session :**
1. [ ] Utilisateur non-admin approuvé connecté sur `/dashboard`
2. [ ] Rafraîchir la page (F5)
3. [ ] **Vérifier que l'utilisateur reste sur `/dashboard`** ✅ (session persistée)
4. [ ] Fermer l'onglet
5. [ ] Rouvrir le navigateur et accéder à l'application
6. [ ] **Vérifier la redirection vers `/sign-in`** ✅ (session expirée)

**Test déconnexion :**
7. [ ] Se reconnecter
8. [ ] Cliquer sur le bouton de déconnexion
9. [ ] **Vérifier la redirection vers `/sign-in`** ✅
10. [ ] Tenter d'accéder à `/dashboard` directement
11. [ ] **Vérifier la redirection vers `/sign-in`** ✅

**Résultat attendu :** ✅ Session gérée correctement

---

### Test 7 : Admin visite Homepage

**Pré-requis :** Admin connecté

**Étapes :**
1. [ ] Admin connecté sur `/admin/dashboard`
2. [ ] Accéder manuellement à `/` (homepage)
3. [ ] **Vérifier que la homepage s'affiche** ✅ (pas de redirection automatique)
4. [ ] Vérifier l'affichage de "Bienvenue, Admin"
5. [ ] Vérifier le badge "Admin" affiché
6. [ ] Vérifier les informations du compte admin
7. [ ] Cliquer sur un lien ou naviguer vers `/admin/dashboard`
8. [ ] Vérifier l'accès au dashboard admin

**Résultat attendu :** ✅ Admin peut visiter la homepage sans être redirigé

---

### Test 8 : Utilisateur change de statut (session active)

**Pré-requis :** 
- Utilisateur non-admin connecté sur page "En attente"
- Admin connecté dans un autre onglet/navigateur

**Étapes :**
1. [ ] **Onglet 1 :** Utilisateur non-admin sur page "En attente"
2. [ ] **Onglet 2 :** Admin approuve l'utilisateur et lui attribue un rôle
3. [ ] **Onglet 1 :** Attendre 5 minutes (rafraîchissement automatique du token JWT)
4. [ ] **Onglet 1 :** Rafraîchir la page
5. [ ] **Vérifier la redirection automatique vers `/dashboard`** ✅

**Résultat attendu :** ✅ Token JWT rafraîchi avec nouvelles permissions, redirection automatique

---

## 🔍 Tests de Sécurité

### Test S1 : Tentative d'accès non autorisé
1. [ ] Utilisateur non approuvé connecté
2. [ ] Accéder directement à `/admin/dashboard` via URL
3. [ ] **Vérifier le blocage** ✅ (redirection vers `/sign-in` ou `/`)

### Test S2 : Injection clé admin
1. [ ] Utilisateur non-admin inscrit
2. [ ] Tenter de modifier `isAdmin` via DevTools/Postman
3. [ ] **Vérifier que le changement ne persiste pas** ✅

### Test S3 : Token manipulation
1. [ ] Utilisateur connecté
2. [ ] Modifier le token JWT dans localStorage/cookies
3. [ ] Rafraîchir la page
4. [ ] **Vérifier la déconnexion automatique** ✅

---

## 📊 Matrice de Validation

| Scénario | isAdmin | isApproved | roleId | Redirection Attendue | Statut |
|----------|---------|------------|--------|---------------------|--------|
| Test 1   | ✅      | ✅         | N/A    | `/admin/dashboard`  | ⬜     |
| Test 3   | ❌      | ❌         | null   | `/` (Attente)       | ⬜     |
| Test 5   | ❌      | ✅         | ✅     | `/` → `/dashboard`  | ⬜     |
| Test 7   | ✅      | ✅         | N/A    | `/` (sans redirect) | ⬜     |

**Légende :**
- ⬜ À tester
- ✅ Test passé
- ❌ Test échoué

---

## 🐛 Journal des Bugs Découverts

| # | Date | Description | Priorité | Statut |
|---|------|-------------|----------|--------|
|   |      |             |          |        |

---

## 📝 Notes de Test

### Configuration requise
- Variables d'environnement :
  - `ADMIN_SECRET_KEY` configurée
  - `NEXTAUTH_SECRET` configurée
  - `DATABASE_URL` valide
- Base de données accessible
- Port 3000 ou configuration Render

### Utilisateurs de test suggérés

**Admin :**
- Email : `admin@gestock.mr`
- Password : `AdminPass123!`
- Clé admin : `[ADMIN_SECRET_KEY]`

**Utilisateur 1 (En attente) :**
- Email : `user1@ministere.mr`
- Password : `User1Pass123!`

**Utilisateur 2 (Approuvé) :**
- Email : `user2@ministere.mr`
- Password : `User2Pass123!`
- Rôle : Agent de saisie
- Ministère : Ministère de la Santé

---

**Testeur :** ___________________  
**Date :** ___________________  
**Environnement :** □ Local  □ Render  
**Version commit :** 909a853
