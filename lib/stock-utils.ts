/**
 * Utilitaires pour la gestion des stocks
 */

/**
 * Statut du stock d'un produit
 */
export type StockStatus = 'normal' | 'alert' | 'low' | 'out';

/**
 * Informations sur le statut du stock
 */
export interface StockStatusInfo {
  status: StockStatus;
  label: string;
  badgeClass: string;
  lowThreshold: number;     // Seuil de stock faible (5%)
  alertThreshold: number;   // Seuil de stock d'alerte (10%)
  percentage: number;       // Pourcentage du stock par rapport à la quantité initiale
}

/**
 * Calcule le seuil de stock faible (5% de la quantité initiale, minimum 1)
 */
export function getLowStockThreshold(initialQuantity: number): number {
  return Math.max(1, Math.ceil(initialQuantity * 0.05));
}

/**
 * Calcule le seuil de stock d'alerte (10% de la quantité initiale, minimum 2)
 */
export function getAlertStockThreshold(initialQuantity: number): number {
  return Math.max(2, Math.ceil(initialQuantity * 0.10));
}

/**
 * Détermine le statut du stock d'un produit
 */
export function getStockStatus(
  currentQuantity: number,
  initialQuantity: number
): StockStatusInfo {
  const lowThreshold = getLowStockThreshold(initialQuantity);
  const alertThreshold = getAlertStockThreshold(initialQuantity);
  const percentage = initialQuantity > 0 
    ? Math.round((currentQuantity / initialQuantity) * 100) 
    : 0;

  if (currentQuantity === 0) {
    return {
      status: 'out',
      label: 'Rupture de stock',
      badgeClass: 'badge-error',
      lowThreshold,
      alertThreshold,
      percentage: 0
    };
  }

  if (currentQuantity <= lowThreshold) {
    return {
      status: 'low',
      label: 'Stock faible',
      badgeClass: 'badge-warning',
      lowThreshold,
      alertThreshold,
      percentage
    };
  }

  if (currentQuantity <= alertThreshold) {
    return {
      status: 'alert',
      label: 'Stock d\'alerte',
      badgeClass: 'badge-info',
      lowThreshold,
      alertThreshold,
      percentage
    };
  }

  return {
    status: 'normal',
    label: 'Stock normal',
    badgeClass: 'badge-success',
    lowThreshold,
    alertThreshold,
    percentage
  };
}

/**
 * Obtient une couleur pour le badge en fonction de la quantité
 * @deprecated Utiliser getStockStatus().badgeClass à la place
 */
export function getQuantityBadgeColor(quantity: number, initialQuantity: number): string {
  return getStockStatus(quantity, initialQuantity).badgeClass;
}

/**
 * Obtient un label pour le statut du stock
 * @deprecated Utiliser getStockStatus().label à la place
 */
export function getStockStatusLabel(quantity: number, initialQuantity: number): string {
  return getStockStatus(quantity, initialQuantity).label;
}
