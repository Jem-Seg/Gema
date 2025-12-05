# 📘 Manuel d'Utilisation - GeStock

**Version 2.0 - Workflow 4 Rôles**  
*Système de Gestion de Stock pour Ministères et Structures Gouvernementales*

> **⚠️ Nouveauté Version 2.0 :**  
> Le workflow a été simplifié avec **4 rôles** au lieu de 5 :  
> Agent de Saisie → Responsable Achats → Responsable Financier → Ordonnateur

---

## 📑 Table des Matières

1. [Introduction](#introduction)
2. [Premiers Pas](#premiers-pas)
3. [Les Rôles Utilisateurs](#les-rôles-utilisateurs)
4. [Navigation dans l'Application](#navigation-dans-lapplication)
5. [Gestion des Produits](#gestion-des-produits)
6. [Alimentations (Entrées de Stock)](#alimentations-entrées-de-stock)
7. [Octrois (Sorties de Stock)](#octrois-sorties-de-stock)
8. [Workflow de Validation](#workflow-de-validation)
9. [Consultation du Stock](#consultation-du-stock)
10. [États Imprimables](#états-imprimables)
11. [Statistiques et Analyses](#statistiques-et-analyses)
12. [FAQ et Résolution de Problèmes](#faq-et-résolution-de-problèmes)

---

## 🎯 Introduction

### Qu'est-ce que GeStock ?

GeStock est une application web moderne de gestion de stock conçue spécifiquement pour les ministères et structures gouvernementales. Elle permet de :

- ✅ Suivre en temps réel l'inventaire des produits
- ✅ Gérer les entrées (alimentations) et sorties (octrois) de stock
- ✅ Valider les opérations selon un workflow structuré
- ✅ Générer des rapports et états imprimables officiels
- ✅ Analyser les tendances et statistiques

### Avantages Clés

- **Centralisation** : Toutes les données de stock en un seul endroit
- **Traçabilité** : Historique complet de tous les mouvements
- **Sécurité** : Système de validation à plusieurs niveaux
- **Alertes** : Notifications automatiques pour les stocks faibles
- **Reporting** : 9 types d'états professionnels prêts à l'emploi

---

## 🚀 Premiers Pas

### 1. Accès à l'Application

1. Ouvrez votre navigateur web (Chrome, Firefox, Edge)
2. Accédez à l'URL fournie par votre administrateur système
3. Vous arrivez sur la page de connexion

### 2. Création de Compte

**Première inscription :**

1. Cliquez sur **"S'inscrire"** ou **"Créer un compte"**
2. Remplissez le formulaire :
   - **Nom** : Votre nom de famille
   - **Prénom** : Votre prénom
   - **Email** : Votre adresse email professionnelle
   - **Mot de passe** : Minimum 8 caractères
   - **Ministère** : Sélectionnez votre ministère de rattachement
3. Cliquez sur **"Créer le compte"**

**⚠️ Important** : Votre compte doit être approuvé par un administrateur avant utilisation.

### 3. Connexion

Une fois votre compte approuvé :

1. Entrez votre **email**
2. Entrez votre **mot de passe**
3. Cliquez sur **"Se connecter"**

### 4. Mot de Passe Oublié

1. Cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre email
3. Consultez votre boîte mail
4. Cliquez sur le lien de réinitialisation
5. Définissez un nouveau mot de passe

---

## 👥 Les Rôles Utilisateurs

GeStock utilise un système de rôles avec des permissions spécifiques.

### 🔵 Agent de Saisie

**Responsabilités :**
- Créer et modifier les alimentations et octrois (statut SAISIE uniquement)
- Ajouter de nouveaux produits au catalogue
- Consulter le stock de son ministère

**Périmètre d'action :**
- Toutes les structures de son ministère

**Ce qu'il ne peut PAS faire :**
- Valider les opérations
- Modifier les opérations en cours de validation
- Accéder aux fonctions d'administration

---

### 🟢 Responsable Achats

**Responsabilités :**
- Valider les alimentations au niveau achats (1er niveau de validation)
- Valider les octrois au niveau achats (1er niveau de validation)
- Demander des modifications ou rejeter
- Consulter toutes les opérations de son ministère

**Workflow :**
- **Alimentations** : Reçoit après la saisie → Valide → Transmet au Responsable Financier
- **Octrois** : Reçoit après la saisie → Valide → Transmet au Responsable Financier

**Décisions possibles :**
- ✅ Valider (passe au Responsable Financier)
- 📝 Demander des modifications (reste en instance achats)
- 💬 Observations sur l'opération

**Périmètre d'action :**
- Tout son ministère (toutes structures)

---

### 🟡 Responsable Financier

**Responsabilités :**
- Valider financièrement les alimentations (2ème niveau)
- Valider financièrement les octrois (2ème niveau)
- Vérifier la conformité budgétaire et financière
- Rejeter ou demander des modifications
- Consulter toutes les opérations de son ministère

**Workflow :**
- **Alimentations** : Reçoit du Responsable Achats → Valide → Transmet à l'Ordonnateur
- **Octrois** : Reçoit du Responsable Achats → Valide → Transmet à l'Ordonnateur

**Décisions possibles :**
- ✅ Valider (passe à l'Ordonnateur)
- 📝 Demander des modifications (reste en instance financier)
- 💬 Ajouter des observations financières

**Périmètre d'action :**
- Tout son ministère (toutes structures)

---

### 🔴 Ordonnateur

**Responsabilités :**
- Validation finale des alimentations et octrois (3ème niveau)
- **Action critique** : La validation de l'Ordonnateur met à jour le stock
- Peut demander des modifications (renvoi au Responsable Achats)
- Supervision transversale de plusieurs ministères

**Workflow :**
- **Alimentations** : Reçoit du Responsable Financier → Valide → ✅ Stock augmenté
- **Octrois** : Reçoit du Responsable Financier → Valide → ✅ Stock diminué

**Décisions possibles :**
- ✅ Valider (mise à jour du stock définitive)
- 📝 Demander modifications (renvoie au Responsable Achats avec statut MIS_EN_INSTANCE)
- ❌ Rejeter définitivement (statut REJETE)

**⚠️ Attention** : La décision de l'Ordonnateur est irréversible et impacte directement le stock.

**Périmètre d'action :**
- Transversal (peut superviser plusieurs ministères)

---

### ⚫ Administrateur

**Responsabilités :**
- Gérer les utilisateurs (approbation, rôles, désactivation)
- Gérer les ministères et structures
- Gérer les catégories de produits
- Accéder aux logs système
- Effectuer les sauvegardes et restaurations
- Configurer l'application

**Accès :**
- **Menu Administration** : Tableau de bord complet
- **Fonctions avancées** : Backup, logs, statistiques globales

**Ce qu'il ne peut PAS faire :**
- Modifier directement les stocks (sauf exception)
- Court-circuiter le workflow de validation

---

## 🧭 Navigation dans l'Application

### Menu Principal

Le menu de navigation se trouve en haut de chaque page.

```
┌─────────────────────────────────────────────────────┐
│  GeStock  │ Dashboard │ Produits │ Alimentations │  │
│           │           │          │ Octrois       │  │
│           │ États     │ Mon Profil               │  │
└─────────────────────────────────────────────────────┘
```

### Pages Principales

| Page | Description | Qui y accède ? |
|------|-------------|----------------|
| **Dashboard** | Vue d'ensemble, statistiques, alertes | Tous |
| **Produits** | Catalogue des produits disponibles | Tous |
| **Nouveau Produit** | Ajouter un produit au catalogue | Agent de saisie |
| **Alimentations** | Liste des entrées de stock | Tous |
| **Octrois** | Liste des sorties de stock | Tous |
| **États** | Génération de rapports imprimables | Tous |
| **Statistiques** | Analyses et graphiques | Tous |
| **Administration** | Gestion système | Administrateur uniquement |

### Barre de Sélection de Structure

En haut de la page, vous verrez :

```
📍 Structure : [Toutes les structures accessibles ▼]
```

**Utilité :** Filtrer les données affichées par structure.

**Options :**
- **Toutes les structures accessibles** : Voir toutes les structures de votre ministère
- **Structure A** : Voir uniquement les données de la structure A
- **Structure B** : Voir uniquement les données de la structure B

---

## 📦 Gestion des Produits

### Consulter le Catalogue

1. Cliquez sur **"Produits"** dans le menu
2. Vous voyez la liste complète des produits

**Informations affichées :**
- Image du produit
- Nom et description
- Catégorie
- Prix unitaire
- Stock disponible
- Unité de mesure
- Structure de rattachement

### Rechercher un Produit

Utilisez la barre de recherche en haut de la liste :
- Recherche par nom
- Recherche par catégorie
- Filtrage par structure

### Ajouter un Nouveau Produit

**Rôle requis :** Agent de saisie

**Étapes :**

1. Cliquez sur **"Nouveau Produit"** dans le menu
2. Remplissez le formulaire :
   - **Nom** : Nom du produit (exemple : "Ramette de papier A4")
   - **Description** : Description détaillée
   - **Catégorie** : Sélectionnez dans la liste
   - **Structure** : Structure de rattachement
   - **Unité** : Unité de mesure (Pièce, Carton, Kg, Litre, etc.)
   - **Prix** : Prix unitaire (optionnel)
   - **Stock initial** : Quantité de départ
   - **Image** : Télécharger une photo du produit
3. Cliquez sur **"Créer le produit"**

**✅ Confirmation** : Message de succès + redirection vers la liste

### Modifier un Produit

1. Dans la liste des produits, cliquez sur le produit
2. Cliquez sur **"Modifier"**
3. Modifiez les champs nécessaires
4. Cliquez sur **"Enregistrer"**

**⚠️ Important** : La modification du stock se fait via les alimentations/octrois, pas ici.

---

## 📥 Alimentations (Entrées de Stock)

Les alimentations permettent d'enregistrer les entrées de stock (achats, dons, transferts entrants).

### Créer une Alimentation

**Rôle requis :** Agent de saisie

**Étapes :**

1. Cliquez sur **"Alimentations"** dans le menu
2. Cliquez sur **"Nouvelle Alimentation"**
3. Remplissez le formulaire :

   **Informations Générales :**
   - **Structure** : Structure bénéficiaire
   - **Date d'alimentation** : Date de réception
   - **Fournisseur** : Nom du fournisseur
   - **Référence** : Numéro de facture/bon de livraison
   - **Observations** : Commentaires éventuels

   **Produits :**
   - Cliquez sur **"Ajouter un produit"**
   - Sélectionnez le produit dans la liste
   - Entrez la quantité
   - Le prix unitaire s'affiche (modifiable)
   - Cliquez sur **"Ajouter"**
   - Répétez pour chaque produit

   **Documents :**
   - Cliquez sur **"Joindre un document"**
   - Sélectionnez le fichier (PDF, image)
   - Le fichier est téléchargé
   - Vous pouvez joindre plusieurs documents

4. Vérifiez les informations
5. Cliquez sur **"Créer l'alimentation"**

**✅ Statut** : L'alimentation est créée avec le statut **EN_ATTENTE**

### Consulter les Alimentations

1. Cliquez sur **"Alimentations"** dans le menu
2. Vous voyez la liste de toutes les alimentations

**Filtres disponibles :**
- Par statut (Saisie, En instance, Validée, Rejetée)
- Par structure
- Par période (date)
- Par fournisseur

**Informations affichées :**
- Référence
- Date
- Fournisseur
- Structure
- Nombre de produits
- Montant total
- Statut avec badge coloré
- Actions disponibles

### Modifier une Alimentation (Statut SAISIE uniquement)

**Rôle requis :** Agent de saisie

1. Ouvrez l'alimentation
2. Vérifiez que le statut est **EN_ATTENTE** ou **EN_INSTANCE_ACHATS**
3. Cliquez sur **"Modifier"**
4. Effectuez vos modifications
5. Cliquez sur **"Enregistrer"**

**⚠️ Important** : 
- **Agent de saisie** : Peut modifier si statut EN_ATTENTE, EN_INSTANCE_ACHATS, EN_INSTANCE_FINANCIER, MIS_EN_INSTANCE ou REJETE
- **Responsable Achats** : Peut modifier si statut EN_INSTANCE_ACHATS, EN_INSTANCE_FINANCIER, MIS_EN_INSTANCE ou REJETE

### Soumettre pour Validation

Une fois l'alimentation créée et vérifiée :

1. Ouvrez l'alimentation
2. Cliquez sur **"Soumettre pour validation"**
3. Confirmez l'action

**✅ Résultat** : L'alimentation passe au statut **EN_INSTANCE_ACHATS** et est transmise au Responsable Achats.

---

## 📤 Octrois (Sorties de Stock)

Les octrois permettent d'enregistrer les sorties de stock (distributions, utilisations, transferts sortants).

### Créer un Octroi

**Rôle requis :** Agent de saisie

**Étapes :**

1. Cliquez sur **"Octrois"** dans le menu
2. Cliquez sur **"Nouvel Octroi"**
3. Remplissez le formulaire :

   **Informations Générales :**
   - **Structure** : Structure émettrice
   - **Date d'octroi** : Date de sortie
   - **Bénéficiaire** : Nom du bénéficiaire/service
   - **Référence** : Numéro de demande/bon de sortie
   - **Observations** : Commentaires éventuels

   **Produits :**
   - Cliquez sur **"Ajouter un produit"**
   - Sélectionnez le produit dans la liste
   - **⚠️ Vérifiez le stock disponible**
   - Entrez la quantité (≤ stock disponible)
   - Cliquez sur **"Ajouter"**
   - Répétez pour chaque produit

   **Documents :**
   - Joignez les documents justificatifs (demande, autorisation)

4. Vérifiez les informations
5. Cliquez sur **"Créer l'octroi"**

**✅ Statut** : L'octroi est créé avec le statut **EN_ATTENTE**

**⚠️ Attention** : Le stock n'est pas encore modifié. Il faut attendre la validation finale de l'Ordonnateur.

### Consulter les Octrois

1. Cliquez sur **"Octrois"** dans le menu
2. Vous voyez la liste de tous les octrois

**Filtres disponibles :**
- Par statut
- Par structure
- Par période
- Par bénéficiaire

### Modifier un Octroi (Statut SAISIE uniquement)

**Rôle requis :** Agent de saisie

Même procédure que pour les alimentations.

### Soumettre pour Validation

1. Ouvrez l'octroi
2. Cliquez sur **"Soumettre pour validation"**
3. Confirmez

**✅ Résultat** : L'octroi passe au statut **EN_INSTANCE_ACHATS** et est transmis au Responsable Achats.

---

## ✅ Workflow de Validation

### Comprendre le Workflow

GeStock utilise un système de validation à 3 niveaux pour garantir la conformité des opérations.

#### Workflow des Alimentations (Entrées)

```
📝 EN_ATTENTE (Agent de saisie)
    ↓ Soumettre
🛒 EN_INSTANCE_ACHATS → Responsable Achats
    ↓ Valider
✅ VALIDE_ACHATS
    ↓ Transmettre
💼 EN_INSTANCE_FINANCIER → Responsable Financier
    ↓ Valider
✅ VALIDE_FINANCIER
    ↓ Transmettre
🎯 EN_INSTANCE_ORDONNATEUR → Ordonnateur
    ↓ Valider
✅ VALIDE_ORDONNATEUR → 🔄 STOCK MIS À JOUR

💡 Note : L'Ordonnateur peut renvoyer (MIS_EN_INSTANCE → Responsable Achats)
```

#### Workflow des Octrois (Sorties)

```
📝 EN_ATTENTE (Agent de saisie)
    ↓ Soumettre
🛒 EN_INSTANCE_ACHATS → Responsable Achats
    ↓ Valider
✅ VALIDE_ACHATS
    ↓ Transmettre
💼 EN_INSTANCE_FINANCIER → Responsable Financier
    ↓ Valider
✅ VALIDE_FINANCIER
    ↓ Transmettre
🎯 EN_INSTANCE_ORDONNATEUR → Ordonnateur
    ↓ Valider
✅ VALIDE_ORDONNATEUR → 🔄 STOCK MIS À JOUR

💡 Note : L'Ordonnateur peut renvoyer (MIS_EN_INSTANCE → Responsable Achats)
```

### Valider une Opération

**Rôles concernés :** Responsable Achats, Responsable Financier, Ordonnateur

**Étapes :**

1. Vous recevez une notification (si activée)
2. Allez dans **"Alimentations"** ou **"Octrois"**
3. Filtrez par statut : **"En instance"** pour voir les opérations en attente
4. Ouvrez l'opération
5. Vérifiez attentivement :
   - Les informations générales
   - Les produits et quantités
   - Les documents joints
   - Les montants (pour alimentations)
6. Vous avez 3 options :

   **Option 1 : ✅ Valider**
   - Cliquez sur **"Valider"**
   - Ajoutez une observation (optionnel)
   - Confirmez
   - L'opération passe au niveau suivant

   **Option 2 : ❌ Rejeter**
   - Cliquez sur **"Rejeter"**
   - **⚠️ Obligatoire** : Saisissez le motif du rejet
   - Confirmez
   - L'opération repasse au statut **SAISIE**
   - L'Agent de saisie peut la modifier et la resoumettre

   **Option 3 : 📝 Demander des Modifications**
   - Cliquez sur **"Demander des modifications"**
   - Précisez les modifications nécessaires
   - L'opération reste en instance
   - L'Agent de saisie est notifié

### Pour l'Ordonnateur (Validation Finale)

**⚠️ Action Critique** : Votre validation met à jour le stock réel.

**Avant de valider, vérifiez :**

- ✅ Tous les niveaux précédents ont validé
- ✅ Les documents justificatifs sont complets
- ✅ Les quantités sont cohérentes
- ✅ Les informations sont correctes

**Une fois validé :**
- **Alimentation** : Le stock augmente automatiquement
- **Octroi** : Le stock diminue automatiquement
- **Irréversible** : L'opération ne peut plus être modifiée

### Suivi du Workflow

Chaque opération affiche son **parcours de validation** :

```
✅ Agent de saisie (Nom) - 01/12/2025 10:30
   "Opération créée - EN_ATTENTE"

✅ Responsable Achats (Nom) - 02/12/2025 09:15
   "Validé - Conformité achats vérifiée - VALIDE_ACHATS"

✅ Responsable Financier (Nom) - 02/12/2025 14:20
   "Validé - Montants conformes - VALIDE_FINANCIER"

⏳ En attente de validation Ordonnateur (EN_INSTANCE_ORDONNATEUR)
```

---

## 📊 Consultation du Stock

### Dashboard

Le **Dashboard** est votre page d'accueil après connexion.

**Informations affichées :**

1. **Statistiques Clés** (30 derniers jours)
   - Nombre d'alimentations
   - Nombre d'octrois
   - Valeur totale du stock
   - Nombre de produits

2. **Alertes de Stock**
   - Produits en rupture (stock = 0)
   - Produits en alerte (stock < 20% du stock initial)
   - Badge rouge avec le nombre d'alertes

3. **Graphiques**
   - Répartition du stock par catégorie
   - Tendances des mouvements
   - Top produits les plus utilisés

4. **Transactions Récentes**
   - Dernières alimentations validées
   - Derniers octrois validés

5. **Actions Rapides**
   - Bouton "Nouvelle Alimentation"
   - Bouton "Nouvel Octroi"
   - Bouton "Consulter les États"

### Page Produits

Affiche tous les produits avec leur stock en temps réel.

**Indicateurs visuels :**
- 🟢 **Vert** : Stock suffisant (> 20% du stock initial)
- 🟡 **Orange** : Stock faible (< 20% du stock initial)
- 🔴 **Rouge** : Rupture de stock (stock = 0)

**Actions disponibles :**
- Voir le détail du produit
- Consulter l'historique des mouvements
- Créer une alimentation pour ce produit
- Créer un octroi pour ce produit (si stock disponible)

### Alertes de Stock

1. Cliquez sur le badge **"🔴 X alertes"** dans le Dashboard
2. Vous voyez la liste des produits en alerte ou en rupture

**Informations affichées :**
- Nom du produit
- Stock actuel
- Stock initial
- Pourcentage restant
- Structure
- Dernière alimentation

**Actions recommandées :**
- Créer une alimentation pour réapprovisionner
- Informer le responsable des achats

---

## 📄 États Imprimables

GeStock propose **9 types d'états professionnels** prêts à imprimer ou exporter en PDF.

### Accéder aux États

1. Cliquez sur **"États"** dans le menu
2. Vous arrivez sur la page des états imprimables

### Types d'États Disponibles

#### 🔵 États de Suivi du Stock

**1. État Général du Stock**

**Utilité :** Vue d'ensemble de tous les produits en stock

**Paramètres :**
- Structure (optionnel) : Filtrer par structure ou voir toutes

**Contenu :**
- Liste complète des produits
- Stock disponible pour chaque produit
- Valeur unitaire et totale
- Catégorie
- Unité de mesure

**Quand l'utiliser :**
- Inventaire mensuel
- Rapport de fin d'année
- Audit des stocks

---

**2. État du Stock par Article**

**Utilité :** Détail complet d'un produit spécifique

**Paramètres :**
- **Produit** (obligatoire) : Sélectionnez le produit
- Structure (optionnel)

**Contenu :**
- Informations détaillées du produit
- Stock actuel, initial, minimum
- Historique des mouvements récents
- Fournisseurs principaux
- Structures ayant ce produit

**Quand l'utiliser :**
- Suivi spécifique d'un produit stratégique
- Analyse de consommation
- Préparation de commande

---

**3. État du Stock par Structure**

**Utilité :** Tous les produits détenus par une structure

**Paramètres :**
- **Structure** (obligatoire)

**Contenu :**
- Liste des produits de la structure
- Stocks disponibles
- Valeur totale du stock de la structure
- Alertes éventuelles

**Quand l'utiliser :**
- Rapport de structure mensuel
- Bilan d'activité
- Demande budgétaire

---

**4. Seuils d'Alerte**

**Utilité :** Produits en rupture ou stock faible

**Paramètres :**
- Structure (optionnel)

**Contenu :**
- Produits en rupture (stock = 0)
- Produits en alerte (stock < 20% initial)
- Pourcentage restant
- Recommandation de réapprovisionnement

**Quand l'utiliser :**
- **Quotidien** pour le suivi
- Préparation des commandes
- Prévention des ruptures

---

#### 🟢 Mouvements du Stock

**5. Bon d'Entrée**

**Utilité :** Document officiel pour une alimentation validée

**Paramètres :**
- **Alimentation** (obligatoire) : Sélectionnez dans la liste des alimentations validées

**Contenu :**
- En-tête officiel avec logos
- Numéro de référence unique
- Date d'alimentation
- Fournisseur
- Structure bénéficiaire
- Tableau détaillé des produits
- Quantités et prix
- Montant total
- Signatures : Fournisseur / Responsable Achats / Responsable Financier / Ordonnateur

**Quand l'utiliser :**
- Archivage des entrées
- Justificatif comptable
- Contrôle de conformité

**Format :** PDF officiel prêt à imprimer

---

**6. Bon de Sortie**

**Utilité :** Document officiel pour un octroi validé

**Paramètres :**
- **Octroi** (obligatoire) : Sélectionnez dans la liste des octrois validés

**Contenu :**
- En-tête officiel
- Numéro de référence unique
- Date de sortie
- Bénéficiaire
- Structure émettrice
- Tableau détaillé des produits
- Quantités distribuées
- Signatures : Bénéficiaire / Responsable Achats / Responsable Financier / Ordonnateur

**Quand l'utiliser :**
- Distribution de fournitures
- Justificatif de sortie
- Archivage comptable

**Format :** PDF officiel prêt à imprimer

---

**7. Mouvements sur Période**

**Utilité :** Récapitulatif de toutes les entrées et sorties sur une période

**Paramètres :**
- **Date de début** (obligatoire)
- **Date de fin** (obligatoire)
- Structure (optionnel)

**Contenu :**
- Résumé :
  - Nombre total d'alimentations
  - Nombre total d'octrois
  - Valeur des entrées
  - Valeur des sorties
  - Solde net
- Tableau des mouvements :
  - Date
  - Type (Entrée/Sortie)
  - Référence
  - Produit
  - Quantité
  - Montant
- Graphiques de tendance

**Quand l'utiliser :**
- Rapport mensuel
- Bilan trimestriel
- Analyse de l'activité

---

**8. Historique par Article**

**Utilité :** Traçabilité complète d'un produit sur une période

**Paramètres :**
- **Produit** (obligatoire)
- **Date de début** (obligatoire)
- **Date de fin** (obligatoire)

**Contenu :**
- Stock au début de période
- Détail chronologique de tous les mouvements :
  - Date
  - Type d'opération
  - Quantité entrée/sortie
  - Fournisseur/Bénéficiaire
  - Référence de l'opération
  - Stock après mouvement
- Stock final
- Variation totale

**Quand l'utiliser :**
- Audit d'un produit
- Enquête sur une anomalie
- Justification d'usage

---

**9. Historique par Structure**

**Utilité :** Activité complète d'une structure sur une période

**Paramètres :**
- **Structure** (obligatoire)
- **Date de début** (obligatoire)
- **Date de fin** (obligatoire)

**Contenu :**
- Résumé de l'activité de la structure
- Liste des alimentations reçues
- Liste des octrois effectués
- Évolution du stock
- Indicateurs de performance

**Quand l'utiliser :**
- Évaluation d'une structure
- Rapport d'activité
- Planification budgétaire

---

### Générer un État

**Procédure générale :**

1. Allez sur la page **"États"**
2. Cliquez sur le bouton de l'état souhaité
3. Un formulaire s'affiche avec les paramètres
4. Remplissez les paramètres requis :
   - Sélectionnez la structure (si applicable)
   - Choisissez les dates (pour les mouvements)
   - Sélectionnez le produit (pour les états par article)
   - Sélectionnez l'alimentation/octroi (pour les bons)
5. Cliquez sur **"Générer l'État"**
6. L'état s'affiche à l'écran en version imprimable

### Imprimer ou Exporter

Une fois l'état généré :

1. Vérifiez le contenu
2. Cliquez sur **"Imprimer"** ou utilisez `Ctrl+P` (Windows) / `Cmd+P` (Mac)
3. Dans la boîte de dialogue d'impression :
   - **Pour imprimer** : Sélectionnez votre imprimante → Imprimer
   - **Pour exporter en PDF** : Sélectionnez "Enregistrer en PDF" → Enregistrer

**💡 Conseil** : Les états sont optimisés pour l'impression A4 portrait ou paysage selon le type.

---

## 📈 Statistiques et Analyses

### Page Statistiques

1. Cliquez sur **"Statistiques"** dans le menu
2. Vous accédez au tableau de bord analytique

**Sections disponibles :**

#### 1. Vue d'Ensemble

- Valeur totale du stock
- Nombre de produits
- Nombre de structures
- Nombre de catégories

#### 2. Tendances (30 derniers jours)

- Graphique des alimentations vs octrois
- Évolution de la valeur du stock
- Produits les plus mouvementés

#### 3. Répartition par Catégorie

- Graphique circulaire du stock par catégorie
- Tableau avec :
  - Catégorie
  - Nombre de produits
  - Valeur totale
  - Pourcentage du stock total

#### 4. Performance par Structure

- Tableau des structures avec :
  - Nombre de produits
  - Valeur du stock
  - Nombre d'alimentations/octrois ce mois
  - Alertes en cours

#### 5. Top Produits

- **Top 10 des produits les plus en stock** (valeur)
- **Top 10 des produits les plus distribués** (quantité)
- **Top 10 des produits en alerte**

### Filtres Disponibles

- **Période** : 7 jours, 30 jours, 90 jours, Année, Personnalisée
- **Structure** : Toutes, ou une structure spécifique
- **Catégorie** : Toutes, ou une catégorie spécifique

### Export des Données

1. Sur une page de statistiques, cliquez sur **"Exporter"**
2. Choisissez le format :
   - **CSV** : Pour Excel/tableur
   - **PDF** : Pour archivage/impression
3. Le fichier se télécharge automatiquement

---

## ❓ FAQ et Résolution de Problèmes

### Questions Fréquentes

#### 🔹 Connexion et Accès

**Q : J'ai créé un compte mais je ne peux pas me connecter**

R : Votre compte doit d'abord être approuvé par un administrateur. Contactez votre service informatique ou l'administrateur système.

---

**Q : J'ai oublié mon mot de passe**

R : Cliquez sur "Mot de passe oublié ?" sur la page de connexion, entrez votre email, et suivez les instructions reçues par mail.

---

**Q : Le lien de réinitialisation a expiré**

R : Les liens de réinitialisation sont valables 1 heure. Recommencez la procédure "Mot de passe oublié".

---

#### 🔹 Gestion des Produits

**Q : Je ne trouve pas le produit que je cherche**

R : 
1. Vérifiez l'orthographe dans la recherche
2. Assurez-vous de sélectionner la bonne structure
3. Si le produit n'existe pas, créez-le avec "Nouveau Produit"

---

**Q : Comment modifier le stock d'un produit ?**

R : Le stock ne se modifie PAS directement. Vous devez créer une alimentation (pour augmenter) ou un octroi (pour diminuer) qui sera validée selon le workflow.

---

**Q : Le stock affiché est incorrect**

R : 
1. Vérifiez que toutes les alimentations/octrois ont été validés par l'Ordonnateur
2. Consultez l'historique du produit pour identifier les anomalies
3. Contactez un administrateur si le problème persiste

---

#### 🔹 Alimentations et Octrois

**Q : Je ne peux plus modifier mon alimentation**

R : **Agent de saisie** : Vous pouvez modifier si le statut est EN_ATTENTE, EN_INSTANCE_ACHATS, EN_INSTANCE_FINANCIER, MIS_EN_INSTANCE ou REJETE. **Responsable Achats** : Vous pouvez modifier si le statut est EN_INSTANCE_ACHATS, EN_INSTANCE_FINANCIER, MIS_EN_INSTANCE ou REJETE. Une fois validée par le Responsable Financier ou l'Ordonnateur, l'opération est verrouillée.

---

**Q : Puis-je annuler une alimentation en cours de validation ?**

R : Non, une fois soumise, seule une demande de modification par un validateur peut permettre de la modifier. L'Ordonnateur peut la renvoyer avec le statut MIS_EN_INSTANCE (retour au Responsable Achats) ou la rejeter définitivement (statut REJETE). Contactez le validateur concerné si nécessaire.

---

**Q : Le stock n'a pas été mis à jour après validation**

R : Le stock est mis à jour uniquement après la validation finale de l'**Ordonnateur** (3ème niveau). Vérifiez le statut de votre opération.

---

**Q : Je veux créer un octroi mais le stock est insuffisant**

R : 
1. Vérifiez le stock disponible du produit
2. Si nécessaire, créez d'abord une alimentation pour réapprovisionner
3. Attendez la validation complète de l'alimentation
4. Puis créez votre octroi

---

**Q : Comment joindre plusieurs documents à une alimentation ?**

R : Cliquez plusieurs fois sur "Joindre un document" et sélectionnez un fichier à chaque fois. Tous les fichiers seront associés à l'opération.

---

#### 🔹 Validation

**Q : Je ne vois pas les opérations en attente de ma validation**

R : 
1. Vérifiez que vous êtes sur la bonne page (Alimentations ou Octrois)
2. Filtrez par statut "En instance"
3. Assurez-vous que votre rôle correspond au niveau de validation attendu
4. Vérifiez que les opérations concernent votre ministère

---

**Q : Que se passe-t-il si je rejette une opération ?**

R : 
- **Responsable Achats/Financier** : L'opération reste en instance avec vos observations. L'Agent de saisie ou le Responsable Achats peut la modifier.
- **Ordonnateur** : Vous avez 2 options :
  * **MIS_EN_INSTANCE** : Renvoie au Responsable Achats pour modification
  * **REJETE** : Rejet définitif, l'opération ne peut plus être modifiée

---

**Q : Puis-je annuler une validation que j'ai effectuée ?**

R : Non, les validations sont définitives. Si vous constatez une erreur après validation, contactez immédiatement le prochain niveau ou un administrateur.

---

#### 🔹 États et Rapports

**Q : L'état généré est vide**

R : 
1. Vérifiez que vous avez sélectionné les bons paramètres (structure, dates, produit)
2. Assurez-vous qu'il existe des données pour ces critères
3. Essayez d'élargir la période de recherche

---

**Q : Comment archiver les états générés ?**

R : 
1. Générez l'état
2. Imprimez-le en PDF (Imprimer → Enregistrer en PDF)
3. Enregistrez le PDF sur votre ordinateur ou serveur de fichiers
4. Nommez-le de façon explicite (ex: "Etat_Stock_General_Dec2025.pdf")

---

**Q : Les montants sont incorrects dans les états**

R : Les montants sont calculés automatiquement à partir des prix unitaires et quantités. Vérifiez :
1. Les prix unitaires des produits dans les alimentations
2. Les quantités saisies
3. Contactez un administrateur si les calculs semblent erronés

---

#### 🔹 Statistiques

**Q : Les statistiques ne correspondent pas à mes calculs**

R : 
1. Vérifiez la période sélectionnée (7 jours, 30 jours, etc.)
2. Assurez-vous de comparer les mêmes périmètres (structure, catégorie)
3. Les statistiques incluent uniquement les opérations **validées**

---

**Q : Comment exporter les données pour Excel ?**

R : 
1. Sur la page Statistiques, cliquez sur "Exporter"
2. Choisissez le format **CSV**
3. Ouvrez le fichier téléchargé avec Excel
4. Excel détectera automatiquement les colonnes

---

### Résolution de Problèmes Techniques

#### 🔧 L'application ne se charge pas

**Solutions :**
1. Vérifiez votre connexion Internet
2. Actualisez la page (`F5` ou `Ctrl+R`)
3. Videz le cache du navigateur :
   - Chrome : `Ctrl+Shift+Suppr` → Cocher "Images et fichiers en cache" → Effacer
   - Firefox : `Ctrl+Shift+Suppr` → Cocher "Cache" → Effacer maintenant
4. Essayez un autre navigateur (Chrome, Firefox, Edge)
5. Contactez le support technique

---

#### 🔧 Erreur lors de l'envoi d'un formulaire

**Solutions :**
1. Vérifiez que tous les champs obligatoires sont remplis (marqués d'un *)
2. Vérifiez les formats (dates, nombres, email)
3. Si vous avez joint un fichier, vérifiez qu'il ne dépasse pas 10 MB
4. Actualisez la page et réessayez
5. Prenez une capture d'écran du message d'erreur et contactez le support

---

#### 🔧 Les images de produits ne s'affichent pas

**Solutions :**
1. Actualisez la page
2. Vérifiez que l'image a bien été uploadée (taille < 5 MB)
3. Formats acceptés : JPG, PNG, GIF, WEBP
4. Contactez un administrateur si le problème persiste

---

#### 🔧 L'impression ne fonctionne pas correctement

**Solutions :**
1. Utilisez la fonction "Imprimer" de l'application (bouton "Imprimer"), pas celle du navigateur
2. Vérifiez les paramètres d'impression :
   - Orientation : Portrait ou Paysage selon l'état
   - Marges : Par défaut
   - Échelle : 100%
3. Essayez d'exporter en PDF puis d'imprimer le PDF
4. Mettez à jour votre navigateur

---

#### 🔧 Les notifications ne s'affichent pas

**Solutions :**
1. Vérifiez les paramètres de notification de votre navigateur
2. Autorisez les notifications pour le site GeStock
3. Vérifiez votre profil utilisateur (notifications activées ?)
4. Contactez un administrateur

---

### Qui Contacter ?

| Problème | Contact |
|----------|---------|
| **Compte non approuvé** | Administrateur système |
| **Mot de passe oublié** | Procédure automatique (lien email) |
| **Problème technique** | Support technique / Administrateur |
| **Question sur le workflow** | Votre responsable hiérarchique |
| **Erreur de données** | Administrateur système |
| **Demande de formation** | Service RH ou Formation |

---

## 📞 Support et Assistance

### Besoin d'Aide ?

Si ce manuel ne répond pas à votre question :

1. **Documentation complète** : Consultez les autres guides disponibles
   - `GUIDE_RAPIDE_ETATS.md` : Guide détaillé des états
   - `ETATS_IMPRIMABLES.md` : Documentation technique des rapports
   - `WORKFLOW_IMPLEMENTATION_COMPLETE.md` : Architecture du workflow

2. **Administrateur Système** : Contactez votre administrateur GeStock

3. **Support Technique** : Email ou téléphone fourni par votre organisation

4. **Formation** : Demandez une session de formation pour votre équipe

---

## 📝 Bonnes Pratiques

### Pour tous les utilisateurs

✅ **À FAIRE :**
- Vérifier régulièrement les alertes de stock
- Remplir tous les champs obligatoires avec précision
- Joindre systématiquement les documents justificatifs
- Consulter l'historique avant toute opération importante
- Exporter régulièrement les états pour archivage
- Maintenir un mot de passe sécurisé (minimum 8 caractères, lettres + chiffres)

❌ **À ÉVITER :**
- Partager votre mot de passe
- Créer des doublons de produits
- Valider sans vérifier les documents
- Ignorer les alertes de stock
- Modifier des opérations en cours de validation (impossible de toute façon)

---

### Pour les Agents de Saisie

✅ **À FAIRE :**
- Vérifier le stock avant de créer un octroi
- Joindre la facture pour chaque alimentation
- Joindre la demande pour chaque octroi
- Remplir correctement les références (numéros de facture, bons de livraison)
- Vérifier les prix unitaires
- Relire avant de soumettre pour validation

❌ **À ÉVITER :**
- Créer des alimentations fictives
- Dépasser le stock disponible dans les octrois
- Omettre les documents justificatifs
- Utiliser des références génériques ("Facture 1", "Bon 2")

---

### Pour les Validateurs

**Responsable Achats :**

✅ **À FAIRE :**
- Vérifier la conformité technique des produits
- Valider la cohérence des quantités demandées
- Contrôler les références fournisseurs
- Demander des précisions si nécessaire (statut reste EN_INSTANCE_ACHATS)
- Transmettre rapidement au Responsable Financier après validation

❌ **À ÉVITER :**
- Valider sans vérifier les spécifications techniques
- Ignorer les documents joints
- Laisser traîner les validations

---

**Responsable Financier :**

✅ **À FAIRE :**
- Vérifier TOUS les montants et calculs
- Contrôler la disponibilité budgétaire
- Vérifier les factures et documents financiers
- Demander des précisions si nécessaire (statut reste EN_INSTANCE_FINANCIER)
- Transmettre rapidement à l'Ordonnateur après validation

❌ **À ÉVITER :**
- Valider sans vérifier les montants
- Ignorer les incohérences budgétaires
- Négliger les justificatifs financiers

---

**Ordonnateur :**

✅ **À FAIRE :**
- Vérifier 3 fois avant la validation finale (stock sera modifié !)
- Contrôler que tous les niveaux précédents ont validé
- Vérifier la complétude des documents
- Utiliser MIS_EN_INSTANCE pour renvoyer au Responsable Achats si modifications nécessaires
- Utiliser REJETE uniquement en cas de rejet définitif

❌ **À ÉVITER :**
- Valider sans relecture complète
- Rejeter définitivement sans justification
- Ignorer les alertes ou incohérences

---

### Pour les Administrateurs

✅ **À FAIRE :**
- Approuver rapidement les nouveaux comptes
- Effectuer des sauvegardes régulières
- Surveiller les logs d'activité
- Former les nouveaux utilisateurs
- Maintenir à jour la liste des structures et ministères
- Nettoyer régulièrement les anciennes sauvegardes

❌ **À ÉVITER :**
- Modifier directement le stock dans la base de données
- Approuver des comptes sans vérification
- Négliger les sauvegardes
- Ignorer les erreurs dans les logs

---

## 🎓 Formation et Prise en Main

### Nouveau Utilisateur : Programme de Formation

**Semaine 1 : Découverte**
- Jour 1 : Lecture de ce manuel (sections 1-4)
- Jour 2 : Création de compte et première connexion
- Jour 3 : Navigation et consultation du catalogue produits
- Jour 4 : Consultation des alimentations et octrois existants
- Jour 5 : Exploration du Dashboard et des statistiques

**Semaine 2 : Pratique selon votre rôle**

*Pour Agent de Saisie :*
- Jour 1 : Créer un produit de test
- Jour 2 : Créer une alimentation de test
- Jour 3 : Créer un octroi de test
- Jour 4 : Joindre des documents
- Jour 5 : Générer des états

*Pour Validateurs (Responsable Achats, Responsable Financier, Ordonnateur) :*
- Jour 1 : Comprendre le workflow complet à 3 niveaux
- Jour 2 : Observer une alimentation du début à la fin (EN_ATTENTE → VALIDE_ORDONNATEUR)
- Jour 3 : Observer un octroi du début à la fin
- Jour 4 : Pratiquer la validation sur des opérations de test
- Jour 5 : Pratiquer les demandes de modification et le workflow MIS_EN_INSTANCE

**Semaine 3 : Autonomie**
- Utilisation réelle de l'application
- Support disponible en cas de question

---

## 🏆 Conclusion

**GeStock est votre outil quotidien** pour une gestion professionnelle et rigoureuse du stock.

**Points clés à retenir :**

1. 🔐 **Sécurité** : Chaque opération est validée à 3 niveaux
2. 📊 **Traçabilité** : Tout est enregistré et historisé
3. 📄 **Conformité** : États officiels prêts à imprimer
4. ⚡ **Efficacité** : Processus optimisés et automatisés
5. 👥 **Collaboration** : Workflow structuré entre les rôles

**En cas de doute :**
- Consultez ce manuel
- Demandez à votre responsable
- Contactez l'administrateur

**Bonne utilisation de GeStock !** 🎉

---

**📌 Document :** Manuel d'Utilisation GeStock  
**🗓 Version :** 2.0 (Workflow 4 rôles)  
**📅 Date :** Décembre 2025  
**✍️ Auteur :** Équipe GeStock  
**📧 Support :** Contactez votre administrateur système
