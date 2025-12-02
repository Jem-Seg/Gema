# Corrections des Statistiques du Dashboard

## Date: 1 décembre 2025

## Problèmes Identifiés

### 1. **Statistiques non à jour après alimentation/octroi**
- Le Dashboard ne se rafraîchissait pas automatiquement après création/modification d'alimentations ou octrois
- Les composants de statistiques n'avaient pas de mécanisme de synchronisation

### 2. **Calcul incorrect des 30 derniers jours**
- La date de fin était à minuit (00:00:00) au lieu de 23:59:59.999
- Les données créées le jour même après minuit n'étaient pas incluses
- Le calcul utilisait 30 jours en arrière au lieu de 29 jours + jour actuel
- Le filtre `lte` (less than or equal) avec une date à minuit excluait les données du jour

## Solutions Implémentées

### 1. **Système d'événements pour rafraîchissement automatique**

#### Fichiers modifiés:
- `app/components/DashboardStats.tsx`
- `app/components/AlimentationModal.tsx`
- `app/give/page.tsx`

#### Changements:
```typescript
// DashboardStats.tsx - Écoute de l'événement
useEffect(() => {
  const loadStats = async () => { ... };
  loadStats();

  // Écouter les événements de mise à jour du stock
  const handleStockUpdate = () => {
    console.log('🔄 [DashboardStats] Événement stockUpdated reçu, rechargement...');
    loadStats();
  };

  window.addEventListener('stockUpdated', handleStockUpdate);
  return () => {
    window.removeEventListener('stockUpdated', handleStockUpdate);
  };
}, [structureId]);
```

```typescript
// AlimentationModal.tsx & give/page.tsx - Émission de l'événement
toast.success('Alimentation créée avec succès !');

// Émettre un événement pour rafraîchir le dashboard
window.dispatchEvent(new Event('stockUpdated'));

resetForm();
```

#### Avantages:
- ✅ Rafraîchissement automatique et immédiat
- ✅ Pas de dépendance entre composants
- ✅ Architecture découplée et maintenable
- ✅ Fonctionne pour toutes les actions (création, modification d'alimentation, octroi)

### 2. **Correction du calcul des dates - 30 derniers jours**

#### Fichiers modifiés:
- `app/components/DashboardStats.tsx`
- `app/actions.ts` (2 fonctions: `getStructureStatistics` et `getAllStructuresStatistics`)
- `app/api/structures/[id]/statistics/route.ts`

#### Avant:
```typescript
// ❌ INCORRECT - Exclut les données du jour après minuit
const endDate = new Date().toISOString().split('T')[0]; // "2025-12-01" → minuit
const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Résultat: 31 jours, mais jour actuel incomplet
```

#### Après:
```typescript
// ✅ CORRECT - Inclut tout le jour actuel jusqu'à 23:59:59.999
const now = new Date();
const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
const endDate = endOfDay.toISOString();

const startOfPeriod = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
startOfPeriod.setHours(0, 0, 0, 0);
const startDate = startOfPeriod.toISOString();

// Résultat: Exactement 30 jours complets (jour actuel + 29 jours précédents)
```

#### Côté serveur (app/actions.ts):
```typescript
// ✅ CORRECT - Dates par défaut avec heures précises
const now = new Date();
const dateDebut = startDate || (() => {
  const d = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  d.setHours(0, 0, 0, 0); // Début de journée il y a 29 jours
  return d;
})();
const dateFin = endDate || (() => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999); // Fin de journée actuelle
  return d;
})();
```

#### Avantages:
- ✅ Les données du jour actuel sont toujours incluses, peu importe l'heure
- ✅ Exactement 30 jours complets de données
- ✅ Cohérence entre client et serveur
- ✅ Filtres Prisma (`gte` et `lte`) fonctionnent correctement

### 3. **Désactivation du cache navigateur**

```typescript
// DashboardStats.tsx
const response = await fetch(url, {
  cache: 'no-store' // Désactiver le cache pour obtenir des données fraîches
});
```

## Tests à Effectuer

### Test 1: Rafraîchissement automatique
1. ✅ Aller sur le Dashboard avec "Toutes les structures accessibles"
2. ✅ Noter les statistiques affichées
3. ✅ Créer une nouvelle alimentation
4. ✅ Vérifier que le Dashboard se rafraîchit automatiquement
5. ✅ Les nouvelles données doivent apparaître sans reload manuel

### Test 2: Rafraîchissement après octroi
1. ✅ Aller sur le Dashboard
2. ✅ Aller sur la page /give
3. ✅ Effectuer un octroi
4. ✅ Retourner au Dashboard
5. ✅ Les statistiques doivent être à jour

### Test 3: Données du jour actuel
1. ✅ Créer une alimentation aujourd'hui
2. ✅ Vérifier qu'elle apparaît immédiatement dans les statistiques des 30 derniers jours
3. ✅ Vérifier les logs console pour confirmer les dates utilisées

### Test 4: Calcul des 30 jours
1. ✅ Vérifier dans les logs que la période couvre exactement 30 jours
2. ✅ Exemple: Si aujourd'hui = 1er décembre 2025
   - Date début: 2 novembre 2025 00:00:00
   - Date fin: 1er décembre 2025 23:59:59.999

## Logs de Débogage

Les logs suivants permettent de vérifier le bon fonctionnement:

```
📊 [DashboardStats] structureId reçu: "all"
🌐 [DashboardStats] Appel API: /api/structures/all/statistics?startDate=2025-11-02T00:00:00.000Z&endDate=2025-12-01T23:59:59.999Z
📅 [API Statistics] Dates parsées: { startDate: '2025-11-02T00:00:00.000Z', endDate: '2025-12-01T23:59:59.999Z' }
🌍 [API Statistics] Mode agrégé détecté
📅 Période: 2025-11-02T00:00:00.000Z → 2025-12-01T23:59:59.999Z
🔍 Alimentations trouvées: X
🔍 Octrois trouvés: Y
✅ [DashboardStats] Données reçues
🔄 [DashboardStats] Événement stockUpdated reçu, rechargement...
```

## Impact

### Avant les corrections:
- ❌ Dashboard ne se rafraîchit pas automatiquement
- ❌ Données du jour parfois manquantes
- ❌ Statistiques "30 derniers jours" incorrectes (31 jours ou jour actuel partiel)
- ❌ Utilisateur doit recharger manuellement la page

### Après les corrections:
- ✅ Dashboard se rafraîchit automatiquement après chaque action
- ✅ Toutes les données du jour actuel incluses jusqu'à 23:59:59.999
- ✅ Exactement 30 jours complets de données
- ✅ Expérience utilisateur fluide et données toujours à jour
- ✅ Cache navigateur désactivé pour les statistiques

## Notes Techniques

1. **Événement personnalisé `stockUpdated`**:
   - Émis par: AlimentationModal (création/modification), page give (octroi)
   - Écouté par: DashboardStats
   - Type: Event natif JavaScript (window.dispatchEvent)

2. **Gestion des dates**:
   - Format ISO complet avec millisecondes
   - Timezone: UTC (toISOString)
   - Précision: milliseconde (999ms)

3. **Filtres Prisma**:
   - `gte` (greater than or equal): Date début à 00:00:00.000
   - `lte` (less than or equal): Date fin à 23:59:59.999
   - Champ filtré: `createdAt`

## Fichiers Modifiés

1. ✅ `app/components/DashboardStats.tsx`
2. ✅ `app/components/AlimentationModal.tsx`
3. ✅ `app/give/page.tsx`
4. ✅ `app/actions.ts` (getStructureStatistics, getAllStructuresStatistics)
5. ✅ `app/api/structures/[id]/statistics/route.ts`

## Conclusion

Les statistiques du Dashboard sont maintenant:
- **À jour en temps réel** grâce au système d'événements
- **Précises** avec le calcul correct des 30 derniers jours
- **Fiables** avec le rafraîchissement automatique et sans cache
