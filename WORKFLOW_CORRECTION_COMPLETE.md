# Workflow Alimentation - Version Corrigée

## 📋 Résumé de la Correction

**Problème identifié :** Confusion sur le rôle du statut `EN_INSTANCE_FINANCIER`
- ❌ **Ancienne compréhension** : EN_INSTANCE_FINANCIER = "corrections demandées par Financier"
- ✅ **Compréhension corrigée** : EN_INSTANCE_FINANCIER = "validé par Resp. Achats, en attente validation Resp. Financier"

**Statut supprimé :** `VALIDE_ACHATS` n'existe pas dans ce workflow

## 🔄 Workflow Complet

### 1️⃣ Agent de Saisie
**Crée une alimentation**
- Statut initial : `EN_ATTENTE`
- Destinataire : **Responsable Achats**

**Si EN_INSTANCE_ACHATS (corrections demandées par Resp. Achats)**
- ✏️ Peut modifier
- 🗑️ Peut supprimer
- ✅ Après modification : reste `EN_INSTANCE_ACHATS` → retourne à **Resp. Achats**

---

### 2️⃣ Responsable Achats
**Voit 3 types d'alimentations :**
1. `EN_ATTENTE` : Nouvelles créations à valider
2. `EN_INSTANCE_ACHATS` : Corrections faites par Agent ou retours du Resp. Financier
3. `EN_INSTANCE_FINANCIER` : Retours du Resp. Financier (corrections demandées)

**Actions disponibles :**

#### Pour EN_ATTENTE :
- 📝 **Mettre en instance** → `EN_INSTANCE_ACHATS` → retourne à **Agent de Saisie**
- ✅ **Valider** → `EN_INSTANCE_FINANCIER` → va à **Resp. Financier**

#### Pour EN_INSTANCE_ACHATS (après corrections Agent) :
- ✅ **Valider** → `EN_INSTANCE_FINANCIER` → va à **Resp. Financier**
- ✏️ Peut modifier
- 🗑️ Peut supprimer

#### Pour EN_INSTANCE_FINANCIER (retours Resp. Financier) :
- ✅ **Valider** (après corrections) → `EN_INSTANCE_FINANCIER` → retourne à **Resp. Financier**
- ✏️ Peut modifier
- 🗑️ Peut supprimer

---

### 3️⃣ Responsable Financier
**Voit uniquement :** `EN_INSTANCE_FINANCIER` (validées par Resp. Achats)

**Actions disponibles :**
- ✅ **Valider** → `VALIDE_FINANCIER` → va à **Ordonnateur**
- 📝 **Mettre en instance** → `EN_INSTANCE_ACHATS` → retourne à **Resp. Achats**

**Note importante :**
- Quand Resp. Financier met en instance, le statut devient `EN_INSTANCE_ACHATS` (pas EN_INSTANCE_FINANCIER)
- Cela signifie : "retour au niveau Achats pour corrections"
- Le Resp. Achats doit alors corriger et re-valider pour renvoyer en EN_INSTANCE_FINANCIER

---

### 4️⃣ Ordonnateur
**Voit uniquement :** `VALIDE_FINANCIER` (validées par Resp. Financier)

**Actions disponibles :**
- ✅ **Valider** → `VALIDE_ORDONNATEUR` + **Mise à jour du stock** ✅
- ❌ **Rejeter** → `REJETE`

---

## 📊 Statuts du Workflow

| Statut | Signification | Vu par | Actions disponibles |
|--------|--------------|--------|---------------------|
| `EN_ATTENTE` | Création Agent | Resp. Achats | Instance / Valider |
| `EN_INSTANCE_ACHATS` | Corrections demandées | Agent de Saisie, Resp. Achats | Modifier / Valider |
| `EN_INSTANCE_FINANCIER` | Validé Achats | Resp. Financier, Resp. Achats (si retour) | Instance / Valider |
| `VALIDE_FINANCIER` | Validé Financier | Ordonnateur | Valider / Rejeter |
| `VALIDE_ORDONNATEUR` | Validation finale | Tous (lecture) | - |
| `REJETE` | Rejeté | Tous (lecture) | - |

## 🔑 Points Clés

### EN_INSTANCE_FINANCIER ≠ Corrections Financier
**C'est le statut qui signifie :**
- ✅ Validé par le Responsable Achats
- ⏳ En attente de validation par le Responsable Financier
- 📋 Équivalent à "VALIDE_ACHATS" dans d'autres systèmes

### 2 Types de "Mise en Instance"

#### 1. Resp. Achats → EN_INSTANCE_ACHATS
- Signifie : "Agent, corrige ceci"
- Retour niveau : Agent de Saisie
- Workflow : Agent corrige → Resp. Achats re-valide

#### 2. Resp. Financier → EN_INSTANCE_ACHATS  
- Signifie : "Resp. Achats, revérifiez ceci"
- Retour niveau : Responsable Achats
- Workflow : Resp. Achats corrige → valide → EN_INSTANCE_FINANCIER → Resp. Financier

## 🛠️ Modifications Techniques Apportées

### Backend (`lib/workflows/alimentation.ts`)

#### validateAlimentation()
```typescript
// Resp. Achats valide
case "Responsable Achats":
  nouveauStatut = "EN_INSTANCE_FINANCIER"; // ✅ Corrigé (était VALIDE_ACHATS)
  break;

// Resp. Financier valide
case "Responsable Financier":
  if (alimentation.statut !== "EN_INSTANCE_FINANCIER") { // ✅ Corrigé
    return { success: false };
  }
  nouveauStatut = "VALIDE_FINANCIER";
  break;
```

#### putAlimentationInInstance()
```typescript
// Resp. Financier met en instance
case "Responsable Financier":
  nouveauStatut = "EN_INSTANCE_ACHATS"; // ✅ Retour au niveau Achats
  break;
```

### Frontend (`app/alimentations/page.tsx`)

#### Filtres par Rôle
```typescript
// Resp. Achats voit :
['EN_ATTENTE', 'EN_INSTANCE_ACHATS', 'EN_INSTANCE_FINANCIER']

// Resp. Financier voit :
['EN_INSTANCE_FINANCIER'] // ✅ Plus VALIDE_ACHATS
```

#### Labels de Statuts
```typescript
'EN_INSTANCE_FINANCIER': '✅ Validé Achats' // ✅ Corrigé
```

#### Permissions
```typescript
// Resp. Achats peut modifier/supprimer :
['EN_ATTENTE', 'EN_INSTANCE_ACHATS', 'EN_INSTANCE_FINANCIER']
// ✅ EN_INSTANCE_FINANCIER ajouté (retours Financier)
```

### Base de Données

#### Migration Réversée
```
✅ 4 alimentations migrées : EN_INSTANCE_ACHATS → EN_INSTANCE_FINANCIER
- f1528ac7-6115-4b87-b824-97b6a04f3b19
- 74840187-9701-45c6-ba10-44f7b192fd26
- b4c4d0e9-3397-4fa7-ae2d-ea4fc2417ba5
- 03099898-c618-4833-ad15-0270f6f2fa4e
```

## ✅ État Actuel de la Base

```
📊 Répartition par statut :
  - EN_INSTANCE_FINANCIER: 4
  - VALIDE_FINANCIER: 1
```

## 🎯 Scénarios d'Usage

### Scénario 1 : Validation Normale
1. Agent crée → `EN_ATTENTE`
2. Resp. Achats valide → `EN_INSTANCE_FINANCIER`
3. Resp. Financier valide → `VALIDE_FINANCIER`
4. Ordonnateur valide → `VALIDE_ORDONNATEUR` + Stock ✅

### Scénario 2 : Corrections Agent
1. Agent crée → `EN_ATTENTE`
2. Resp. Achats demande corrections → `EN_INSTANCE_ACHATS`
3. Agent modifie → reste `EN_INSTANCE_ACHATS`
4. Resp. Achats valide → `EN_INSTANCE_FINANCIER`
5. Suite du workflow normal...

### Scénario 3 : Retour Financier
1. Alimentation à `EN_INSTANCE_FINANCIER`
2. Resp. Financier demande corrections → `EN_INSTANCE_ACHATS`
3. Resp. Achats reçoit, corrige
4. Resp. Achats re-valide → `EN_INSTANCE_FINANCIER`
5. Resp. Financier valide → `VALIDE_FINANCIER`
6. Suite du workflow normal...

## 📝 Notes Importantes

1. **VALIDE_ACHATS n'existe pas** dans ce workflow
   - Remplacé par `EN_INSTANCE_FINANCIER` qui signifie "validé par Achats"

2. **EN_INSTANCE_FINANCIER a 2 rôles**
   - Pour Resp. Financier : alimentations à valider
   - Pour Resp. Achats : retours du Financier (si mis en instance)

3. **EN_INSTANCE_ACHATS a 2 sources possibles**
   - Resp. Achats demande corrections → retourne à Agent
   - Resp. Financier demande corrections → retourne à Resp. Achats

4. **Visibilité stricte par rôle**
   - Chaque rôle ne voit que ses alimentations pertinentes
   - Filtrage automatique côté serveur et client

## 🚀 Prochaines Étapes

- [x] ✅ Corriger backend (validateAlimentation)
- [x] ✅ Corriger backend (putAlimentationInInstance)
- [x] ✅ Restaurer EN_INSTANCE_FINANCIER dans frontend
- [x] ✅ Supprimer VALIDE_ACHATS du frontend
- [x] ✅ Inverser migration de données
- [x] ✅ Vérifier absence de VALIDE_ACHATS en base
- [ ] ⏳ Tests complets du workflow
- [ ] ⏳ Documentation utilisateur

---

**Date de correction :** 28 novembre 2025  
**Fichiers modifiés :**
- `lib/workflows/alimentation.ts`
- `app/alimentations/page.tsx`
- Scripts de migration : `reverse-migration-financier.mjs`, `check-valide-achats.mjs`
