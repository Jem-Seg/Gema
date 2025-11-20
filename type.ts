import { Produit as PrismaProduit, Structure, Ministere } from "@prisma/client";
import { Transaction as PrismaTransaction } from "@prisma/client";


export interface Produit extends PrismaProduit {
  categoryName: string; // Le nom de la catégorie
  structure?: Structure & { ministere: Ministere }; // Structure optionnelle avec son ministère
}
export interface formDataType {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  price?: number; // Prix optionnel - défini par les alimentations
  quantity?: number;
  categoryIdStructureId?: string;
  unit: string;
  categoryName?: string;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  name?: string;
  availableQuantity?: number;
}
export interface Transaction extends PrismaTransaction {
  categoryName: string;
  productName?: string;
  imageUrl?: string;
  price?: number;
  unit?: string;
}

export interface ProductOverviewStats {
  structure: {
    id: string;
    name: string;
    ministere: {
      id: string;
      name: string;
      abreviation: string;
    };
  };
  overview: {
    totalProducts: number;
    totalCategories: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalTransactions: number;
    stockValue: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    categoryName: string;
    transactionCount: number;
    totalQuantityUsed: number;
    currentStock: number;
    unit: string;
  }>;
  alerts: {
    lowStock: boolean;
    outOfStock: boolean;
    lowStockCount: number;
    outOfStockCount: number;
  };
}
export interface ChartData {
  name: string;
  value?: number;
  pv?: number;
  uv?: number;
}

export interface StockSummary {
  inStockCount: number;
  alertStockCount: number;  // Stock d'alerte (≤ 10% de la quantité initiale)
  lowStockCount: number;    // Stock faible (≤ 5% de la quantité initiale)
  outOfStockCount: number;
  criticalProducts: Produit[]
}

// Statistiques détaillées par produit pour une structure
export interface ProductStatistics {
  produitId: string;
  produitName: string;
  produitUnit: string;
  categoryName: string;
  imageUrl: string;
  
  // Statistiques des alimentations
  alimentations: {
    count: number;                  // Nombre total d'alimentations
    quantiteTotale: number;         // Quantité totale entrée
    valeurTotaleMRU: number;        // Valeur totale en MRU
    prixMoyenUnitaire: number;      // Prix moyen unitaire
    dernierPrixUnitaire: number | null;  // Dernier prix utilisé
    derniereAlimentationDate: Date | string | null;  // Peut être Date, string ou null
  };
  
  // Statistiques des octrois
  octrois: {
    count: number;                  // Nombre total d'octrois
    quantiteTotale: number;         // Quantité totale sortie
    valeurTotaleMRU: number;        // Valeur estimée en MRU (basée sur prix alimentations)
    dernierOctroiDate: Date | string | null;  // Peut être Date, string ou null
  };
  
  // Métriques de stock
  stock: {
    actuel: number;                 // Stock actuel
    initial: number;                // Stock initial
    tauxUtilisation: number;        // % du stock initial utilisé
    tauxRotation: number;           // Nombre de renouvellements de stock
  };
}

// Statistiques globales d'une structure sur une période
export interface StructureStatistics {
  structureId: string;
  structureName: string;
  ministereId: string;
  ministereName: string;
  periode: {
    debut: Date | string;  // Peut être Date ou string (JSON)
    fin: Date | string;    // Peut être Date ou string (JSON)
  };
  
  // Vue d'ensemble
  overview: {
    // Alimentations
    totalAlimentations: number;
    quantiteTotaleAlimentations: number;
    valeurTotaleAlimentationsMRU: number;
    
    // Octrois
    totalOctrois: number;
    quantiteTotaleOctrois: number;
    valeurTotaleOctroisMRU: number;
    
    // Produits
    produitsDistincts: number;
    
    // Statuts workflow
    alimentationsEnAttente: number;
    alimentationsValidees: number;
    alimentationsRejetees: number;
    octroiEnAttente: number;
    octroiValides: number;
    octroiRejetes: number;
  };
  
  // Statistiques détaillées par produit
  parProduit: ProductStatistics[];
  
  // Top 5 produits
  topProduits: {
    plusAlimentes: ProductStatistics[];      // Top 5 par quantité alimentée
    plusOctroyes: ProductStatistics[];        // Top 5 par quantité octroyée
    plusValeurAlimentations: ProductStatistics[];  // Top 5 par valeur MRU
  };
  
  // Alimentations détaillées par produit et structure
  alimentationsParProduitStructure?: Array<{
    produitId: string;
    produitName: string;
    produitUnit: string;
    categoryName: string;
    structures: Array<{
      structureId: string;
      structureName: string;
      ministereAbrev: string;
      count: number;
      quantiteTotale: number;
      valeurTotaleMRU: number;
    }>;
    totaux: {
      count: number;
      quantiteTotale: number;
      valeurTotaleMRU: number;
    };
  }>;
}
