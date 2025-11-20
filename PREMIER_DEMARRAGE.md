# 🚀 Guide de Premier Démarrage - GeStock

## Base de données vide - Configuration initiale

La base de données a été réinitialisée. Vous allez maintenant créer le compte administrateur initial.

---

## 📋 Étape 1 : Créer le compte administrateur

1. **Accédez à la page d'inscription** : http://localhost:3000/sign-up

2. **Vous verrez un message** : 
   ```
   ℹ️ Aucun utilisateur détecté. Créez le premier compte administrateur.
   ```

3. **Remplissez le formulaire** :
   - **Clé d'administration** : `admin-secure-key-nguerida-76` ⚠️ **REQUIS**
   - **Prénom** : Votre prénom
   - **Nom** : Votre nom  
   - **Email** : Votre email (exemple: admin@nguerida.gov)
   - **Mot de passe** : Minimum 8 caractères
   - **Confirmer le mot de passe** : Le même mot de passe

4. **Cliquez sur "S'inscrire"**

5. **Message de confirmation** : 
   ```
   ✅ Compte administrateur créé avec succès ! Vous pouvez maintenant vous connecter.
   ```

---

## 🔑 Étape 2 : Se connecter

1. **Accédez à la page de connexion** : http://localhost:3000/sign-in

2. **Connectez-vous** avec l'email et le mot de passe que vous avez créés

3. **Vous serez redirigé** vers le tableau de bord administrateur

---

## 🏢 Étape 3 : Configuration du système

Une fois connecté en tant qu'administrateur, vous devez configurer :

### 3.1 Créer les Ministères
- Allez dans **Admin** > **Ministères**
- Créez votre/vos ministère(s)
- Renseignez : Nom, Abréviation, Adresse, Téléphone, Email

### 3.2 Créer les Structures
- Allez dans **Admin** > **Structures**
- Pour chaque ministère, créez les structures rattachées
- Renseignez : Nom, Abréviation, Description, Ministère

### 3.3 Créer les Rôles
- Allez dans **Admin** > **Rôles**
- Créez les rôles nécessaires :
  - **Agent de saisie** (nécessite une structure)
  - **Responsable Achats** (accès ministère)
  - **Directeur Financier** (accès ministère)
  - **Directeur** (nécessite une structure)
  - **Ordonnateur** (accès ministère)

### 3.4 Créer les Utilisateurs
- Allez dans **Admin** > **Utilisateurs**
- Créez les comptes utilisateurs
- Assignez : Ministère, Structure (si nécessaire), Rôle
- Approuvez les comptes

---

## 👤 Étape 4 : Mise à jour de votre profil (Optionnel)

En tant qu'administrateur, vous pouvez :
- **Vous rattacher à un ministère** si vous souhaitez être lié à un ministère spécifique
- ⚠️ **Note** : Un administrateur n'est **jamais** rattaché à une structure
- Accès : **Admin** > **Paramètres** > **Mon Profil**

---

## 🔐 Informations de Sécurité

### Clé d'administration
- **Valeur actuelle** : `admin-secure-key-nguerida-76`
- **Emplacement** : Fichier `.env` (variable `ADMIN_SECRET_KEY`)
- **Utilisation** : Requise UNIQUEMENT lors de la création du premier compte admin
- **Sécurité** : Ne partagez JAMAIS cette clé publiquement

### Privilèges Administrateur
Le compte administrateur créé aura :
- ✅ `isAdmin: true` - Accès total au système
- ✅ `isApproved: true` - Compte auto-approuvé
- ✅ Accès à toutes les fonctionnalités d'administration
- ✅ Accès à tous les ministères et structures (même sans rattachement)

---

## 📊 État Actuel du Système

- ✅ Base de données : **Réinitialisée et prête**
- ✅ Serveur : **Démarré sur http://localhost:3000**
- ✅ API d'inscription : **Configurée pour le premier utilisateur**
- ✅ Clé admin : **Définie dans .env**
- ⏳ Utilisateurs : **0 (en attente de création)**
- ⏳ Ministères : **0 (à créer par l'admin)**
- ⏳ Structures : **0 (à créer par l'admin)**
- ⏳ Rôles : **0 (à créer par l'admin)**

---

## 🚨 Après la création du premier admin

Une fois le premier compte administrateur créé :
- ❌ Le champ "Clé d'administration" **disparaîtra** du formulaire d'inscription
- 🔒 Les nouveaux utilisateurs devront être **approuvés** par l'administrateur
- 👥 Seul l'admin peut créer et gérer les comptes utilisateurs

---

## 📞 Support

En cas de problème :
1. Vérifiez que le serveur est démarré (`npm run dev`)
2. Vérifiez que la clé admin est correcte dans `.env`
3. Vérifiez les logs du serveur pour les erreurs

---

**Prêt à commencer !** 🎉

Rendez-vous sur http://localhost:3000/sign-up pour créer votre compte administrateur.
