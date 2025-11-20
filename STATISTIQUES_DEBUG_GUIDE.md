# Guide de Débogage - Page Statistiques

## Problème Signalé
"Aucune donnée ne s'affiche sur la page Statistiques"

## Corrections Appliquées

### 1. Types TypeScript Corrigés
- **Problème** : Les types utilisaient `Date` qui ne peut pas être sérialisé en JSON
- **Solution** : Modifié `StructureStatistics` et `ProductStatistics` pour accepter `Date | string`
  - `periode.debut: Date | string`
  - `periode.fin: Date | string`
  - `derniereAlimentationDate: Date | string | null`
  - `dernierOctroiDate: Date | string | null`

### 2. Logs de Débogage Ajoutés

**Dans `/app/statistiques/page.tsx`** :
```typescript
console.log('🔒 Pas authentifié ou pas d\'ID utilisateur');
console.log('📡 Chargement des structures pour user:', session.user.id);
console.log('📡 Réponse API /api/user status:', response.status);
console.log('✅ Données user reçues:', data);
console.log('📋 Structures trouvées:', structures.length);
console.log('🎯 Auto-sélection de la structure:', autoSelectedId);
console.log('❌ Erreur API user:', errorData);
```

**Dans `/app/components/StructureStatistics.tsx`** :
```typescript
console.log('📊 Chargement des statistiques depuis:', url);
console.log('📊 Réponse API status:', response.status);
console.log('✅ Données reçues:', data);
console.log('❌ Erreur API:', errorData);
console.log('❌ Erreur loadStatistics:', err);
```

## Comment Tester et Déboguer

### Étape 1 : Accéder à la Page
1. Ouvrez votre navigateur à `http://localhost:3000`
2. Connectez-vous avec vos identifiants
3. Cliquez sur "Statistiques" dans la navbar

### Étape 2 : Ouvrir la Console de Débogage
1. **Chrome/Edge** : Appuyez sur `F12` ou `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. **Firefox** : Appuyez sur `F12` ou `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
3. **Safari** : Activez d'abord le menu Développement dans Préférences > Avancées, puis `Cmd+Option+C`

### Étape 3 : Analyser les Logs

#### Scénario 1 : Chargement des Structures
**Logs attendus** :
```
📡 Chargement des structures pour user: <user-id>
📡 Réponse API /api/user status: 200
✅ Données user reçues: { user: {...}, structures: [...] }
📋 Structures trouvées: X
```

**Si vous voyez** :
- `🔒 Pas authentifié ou pas d'ID utilisateur` → Problème de session, reconnectez-vous
- `❌ Erreur API user:` → Vérifiez l'API `/api/user/[id]`
- `📋 Structures trouvées: 0` → Votre compte n'a pas de structure assignée

#### Scénario 2 : Sélection de Structure
**Logs attendus** :
```
🎯 Auto-sélection de la structure: <structure-id>
```
OU manuellement si plusieurs structures disponibles.

#### Scénario 3 : Chargement des Statistiques
**Logs attendus** :
```
📊 Chargement des statistiques depuis: /api/structures/<id>/statistics?startDate=...&endDate=...
📊 Réponse API status: 200
✅ Données reçues: { structureId: "...", structureName: "...", ... }
```

**Si vous voyez** :
- `📊 Réponse API status: 404` → Structure introuvable
- `📊 Réponse API status: 500` → Erreur serveur (voir logs serveur)
- `❌ Erreur API:` → Voir le message d'erreur détaillé
- `❌ Erreur loadStatistics:` → Problème réseau ou parsing JSON

### Étape 4 : Vérifier les Données Retournées

Dans la console, tapez :
```javascript
// Après que les stats soient chargées
console.table(window.localStorage)
```

Ou vérifiez manuellement l'objet `data` dans les logs `✅ Données reçues:`.

**Structure attendue** :
```json
{
  "structureId": "xxx",
  "structureName": "Nom Structure",
  "ministereId": "xxx",
  "ministereName": "Nom Ministère",
  "periode": {
    "debut": "2024-10-19T...",
    "fin": "2024-11-19T..."
  },
  "overview": {
    "totalAlimentations": 10,
    "quantiteTotaleAlimentations": 500,
    "valeurTotaleAlimentationsMRU": 15000,
    "totalOctrois": 5,
    "quantiteTotaleOctrois": 200,
    "valeurTotaleOctroisMRU": 6000,
    "produitsDistincts": 8,
    ...
  },
  "parProduit": [...],
  "topProduits": {
    "plusAlimentes": [...],
    "plusOctroyes": [...],
    "plusValeurAlimentations": [...]
  }
}
```

### Étape 5 : Vérifier les Logs Serveur

Dans le terminal où tourne `npm run dev`, vérifiez :
```
GET /api/user/[id] 200 in XXXms
GET /api/structures/[id]/statistics 200 in XXXms
```

**Si vous voyez** :
- `GET /api/structures/[id]/statistics 404` → Structure n'existe pas
- `GET /api/structures/[id]/statistics 500` → Erreur dans `getStructureStatistics()`
- `Erreur API statistiques structure:` → Voir le message d'erreur détaillé

## Problèmes Fréquents et Solutions

### Problème 1 : "Aucune structure accessible"
**Cause** : L'utilisateur n'a pas de `structureId` ou `ministereId` assigné
**Solution** :
1. Vérifiez dans la base de données : `SELECT * FROM User WHERE id = '<user-id>'`
2. Assignez une structure : Aller dans `/admin/users` et modifier l'utilisateur
3. Pour les responsables : Assignez un ministère

### Problème 2 : "Les statistiques ne se chargent pas"
**Cause** : Erreur dans la fonction `getStructureStatistics()`
**Solution** :
1. Vérifiez les logs serveur pour l'erreur exacte
2. Vérifiez que la structure a des produits : `SELECT * FROM Produit WHERE structureId = '<id>'`
3. Vérifiez qu'il y a des alimentations/octrois : `SELECT COUNT(*) FROM Alimentation WHERE structureId = '<id>'`

### Problème 3 : "Données vides mais pas d'erreur"
**Cause** : Pas d'alimentations/octrois dans la période sélectionnée
**Solution** :
1. Élargissez la période (dates de début/fin)
2. Vérifiez les dates des alimentations dans la DB
3. Essayez "Derniers 3 mois" ou "Dernière année"

### Problème 4 : "Auto-sélection ne fonctionne pas"
**Cause** : L'utilisateur a plusieurs structures via son ministère
**Solution** : C'est normal ! L'auto-sélection ne fonctionne que pour Agent/Directeur (1 structure)

## Vérifications de la Base de Données

### Vérifier l'utilisateur
```sql
SELECT 
  u.id, u.name, u.email, u.isAdmin,
  r.name as role,
  m.name as ministere,
  s.name as structure
FROM User u
LEFT JOIN Role r ON u.roleId = r.id
LEFT JOIN Ministere m ON u.ministereId = m.id
LEFT JOIN Structure s ON u.structureId = s.id
WHERE u.email = '<votre-email>';
```

### Vérifier les structures accessibles
```sql
-- Pour un admin
SELECT * FROM Structure;

-- Pour un responsable de ministère
SELECT s.* 
FROM Structure s 
WHERE s.ministereId = '<ministere-id>';

-- Pour un agent/directeur
SELECT * FROM Structure WHERE id = '<structure-id>';
```

### Vérifier les données disponibles
```sql
-- Alimentations de la structure
SELECT 
  COUNT(*) as total,
  SUM(quantite) as quantite_totale,
  SUM(quantite * prixUnitaire) as valeur_totale,
  MIN(createdAt) as plus_ancienne,
  MAX(createdAt) as plus_recente
FROM Alimentation
WHERE structureId = '<structure-id>';

-- Octrois de la structure
SELECT 
  COUNT(*) as total,
  SUM(quantite) as quantite_totale,
  MIN(createdAt) as plus_ancien,
  MAX(createdAt) as plus_recent
FROM Octroi
WHERE structureId = '<structure-id>';

-- Produits actifs
SELECT COUNT(*) as total_produits
FROM Produit
WHERE structureId = '<structure-id>';
```

## Test Manuel Complet

### Prérequis
1. ✅ Serveur Next.js en cours (`npm run dev`)
2. ✅ Base de données avec au moins :
   - 1 utilisateur authentifié
   - 1 structure assignée à cet utilisateur
   - Quelques produits dans cette structure
   - Quelques alimentations/octrois (optionnel mais recommandé)

### Étapes
1. **Connexion**
   - Allez sur `http://localhost:3000/sign-in`
   - Connectez-vous
   - Vérifiez que vous êtes redirigé vers le dashboard

2. **Accès à la page Statistiques**
   - Cliquez sur "Statistiques" dans la navbar
   - Vérifiez que la page se charge sans erreur

3. **Sélection de structure**
   - **Si agent/directeur** : La structure devrait être auto-sélectionnée
   - **Si responsable/admin** : Sélectionnez une structure dans la grille ou le dropdown
   - Cliquez sur "Afficher les statistiques"

4. **Visualisation des données**
   - Vérifiez que les 4 cartes de vue d'ensemble s'affichent
   - Vérifiez les valeurs : alimentations, octrois, produits actifs, statuts
   - Dépliez "Top 5 produits" et vérifiez les listes
   - Scrollez vers le tableau détaillé et vérifiez les colonnes

5. **Filtrage par période**
   - Modifiez la date de début (ex: il y a 3 mois)
   - Cliquez sur "Actualiser"
   - Vérifiez que les données changent

6. **Export CSV**
   - Cliquez sur "Exporter CSV"
   - Vérifiez qu'un fichier est téléchargé
   - Ouvrez-le et vérifiez le contenu

## État Actuel du Code

### Fichiers Modifiés
1. ✅ `/type.ts` - Types corrigés pour JSON
2. ✅ `/app/api/user/[id]/route.ts` - Retourne structures accessibles
3. ✅ `/app/statistiques/page.tsx` - Logs de débogage ajoutés
4. ✅ `/app/components/StructureStatistics.tsx` - Logs de débogage ajoutés

### Fonctionnalités Testées
- ✅ Compilation TypeScript sans erreurs
- ✅ API `/api/user/[id]` retourne les bonnes structures
- ✅ API `/api/structures/[id]/statistics` compile correctement
- ✅ Types compatibles avec JSON (Date | string)

### Prochaine Étape
**TESTER DANS LE NAVIGATEUR** et analyser les logs de la console pour identifier où les données ne s'affichent pas.

## Si le problème persiste

Partagez les informations suivantes :
1. **Console du navigateur** : Copier tous les logs (avec émojis)
2. **Logs du serveur** : Copier les logs du terminal `npm run dev`
3. **Données utilisateur** : Résultat de la requête SQL de vérification
4. **Screenshot** : Ce que vous voyez à l'écran

Cela permettra d'identifier précisément où le problème se situe dans le flux de données.
