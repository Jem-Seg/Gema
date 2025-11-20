# Implémentation du Seuil de Stock Faible (5%)

## Résumé

Le stock d'un produit est maintenant considéré comme faible s'il est **≤ 5% de sa quantité initiale** (avec un minimum de 1 unité).

## Modifications apportées

### 1. Base de données

**Fichier**: `prisma/schema.prisma`
- Ajout du champ `initialQuantity Int @default(0)` au modèle `Produit`
- Ce champ stocke la quantité de départ du produit pour calculer le seuil de 5%

**Migration**: `20251119014858_add_initial_quantity_to_produit`
- Appliquée avec succès
- Script `scripts/set-initial-quantities.mjs` créé pour initialiser les quantités existantes

### 2. Utilitaires

**Fichier**: `lib/stock-utils.ts` (nouveau)

Fonctions créées :
- `getLowStockThreshold(initialQuantity)` : Calcule le seuil (5% avec minimum de 1)
- `getStockStatus(currentQuantity, initialQuantity)` : Retourne le statut complet du stock
  - `status`: 'normal' | 'low' | 'out'
  - `label`: Libellé du statut
  - `badgeClass`: Classe CSS DaisyUI appropriée
  - `threshold`: Seuil calculé
  - `percentage`: Pourcentage du stock restant

### 3. Backend

**Fichier**: `app/actions.ts`
- Fonction `getStockSummary()` mise à jour
- Calcul dynamique basé sur 5% de `initialQuantity` au lieu de valeurs fixes

**Avant** :
```typescript
const inStock = allProducts.filter((p) => p.quantity > 5);
const lowStock = allProducts.filter((p) => p.quantity > 0 && p.quantity <= 2);
```

**Après** :
```typescript
const inStock = allProducts.filter((p) => {
  const threshold = Math.max(1, Math.ceil(p.initialQuantity * 0.05));
  return p.quantity > threshold;
});

const lowStock = allProducts.filter((p) => {
  const threshold = Math.max(1, Math.ceil(p.initialQuantity * 0.05));
  return p.quantity > 0 && p.quantity <= threshold;
});
```

### 4. Composants Frontend

#### `app/components/Stock.tsx`
- Import de `getStockStatus` depuis `@/lib/stock-utils`
- Affichage dynamique du statut du stock avec pourcentage
- Badge coloré selon le statut (success/warning/error)

#### `app/products/page.tsx`
- Import de `getStockStatus`
- Mise à jour des badges de stock (vue desktop et mobile)
- Affichage du pourcentage restant pour les stocks faibles

**Exemple d'affichage** :
- Stock normal (>5%) : Badge vert "150 kg"
- Stock faible (≤5%) : Badge orange "5 kg" + "Stock faible (3%)"
- Rupture (0) : Badge rouge "0 kg" + "Rupture de stock"

### 5. Règles de gestion

| Quantité initiale | Seuil (5%) | Quantité actuelle | Statut |
|-------------------|------------|-------------------|--------|
| 100 | 5 | 6+ | Normal ✅ |
| 100 | 5 | 1-5 | Faible ⚠️ |
| 100 | 5 | 0 | Rupture ❌ |
| 10 | 1* | 2+ | Normal ✅ |
| 10 | 1* | 1 | Faible ⚠️ |
| 10 | 1* | 0 | Rupture ❌ |

*Le seuil minimum est toujours de 1 unité

## Exemples concrets

### Produit A : Semence rizicole
- Quantité initiale : 1500 kg
- Seuil de stock faible : 75 kg (5%)
- Si stock actuel = 50 kg → **Stock faible (3%)**

### Produit B : Thé vert
- Quantité initiale : 26 cartons
- Seuil de stock faible : 2 cartons (Math.ceil(26 * 0.05) = 2)
- Si stock actuel = 2 cartons → **Stock faible (8%)**

### Produit C : Biscuits
- Quantité initiale : 10 paquets
- Seuil de stock faible : 1 paquet (minimum)
- Si stock actuel = 1 paquet → **Stock faible (10%)**

## Migration des données existantes

Le script `scripts/set-initial-quantities.mjs` a été exécuté avec succès :
```
✅ 5 produits trouvés
✓ Semence rizicole uv-3: initialQuantity défini à 1500
✓ Thé vert azawad: initialQuantity défini à 26
✓ Insecticides: initialQuantity défini à 550
✓ Thé vert azawad: initialQuantity défini à 15
✓ Biscuit : initialQuantity défini à 0
```

## Avantages

1. **Flexibilité** : Le seuil s'adapte automatiquement à la taille du stock de chaque produit
2. **Précision** : Un produit avec un stock initial de 1000 unités aura un seuil de 50 unités, tandis qu'un produit avec 10 unités aura un seuil de 1
3. **Visibilité** : Affichage du pourcentage restant pour une meilleure compréhension
4. **Évolutivité** : Possibilité future de personnaliser le pourcentage (5%, 10%, etc.) par catégorie ou produit

## Prochaines étapes possibles

- [ ] Ajouter un paramètre configurable pour le pourcentage (par défaut 5%)
- [ ] Permettre la personnalisation du seuil par catégorie de produit
- [ ] Créer des alertes automatiques quand un produit atteint le seuil
- [ ] Ajouter un historique des variations de stock
