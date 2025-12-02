'use client';

import { useEffect, useState } from 'react';
import { StructureStatistics } from '@/type';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface TopProductsWidgetProps {
  structureId?: string;
}

export default function TopProductsWidget({ structureId }: TopProductsWidgetProps) {
  const [statistics, setStatistics] = useState<StructureStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alim' | 'oct'>('alim');

  useEffect(() => {
    const loadStats = async () => {
      // Attendre que structureId soit défini (peut être "" pour toutes les structures)
      if (structureId === undefined) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Si structureId est vide, utiliser 'all' pour les statistiques agrégées
        const url = `/api/structures/${structureId || 'all'}/statistics?startDate=${startDate}&endDate=${endDate}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques');
        }

        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        console.error('Erreur chargement top produits:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [structureId]);

  if (loading) {
    return (
      <div className="border-2 border-base-200 p-6 rounded-3xl">
        <div className="skeleton h-48 w-full"></div>
      </div>
    );
  }

  if (!statistics || (statistics.topProduits.plusAlimentes.length === 0 && statistics.topProduits.plusOctroyes.length === 0)) {
    return null;
  }

  const displayedProducts = activeTab === 'alim' 
    ? statistics.topProduits.plusAlimentes.slice(0, 5)
    : statistics.topProduits.plusOctroyes.slice(0, 5);

  return (
    <div className="border-2 border-base-200 p-6 rounded-3xl">
      <h2 className="text-xl font-bold mb-4 text-[#793205]">
        Top Produits (30j)
      </h2>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-4">
        <button 
          className={`tab ${activeTab === 'alim' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('alim')}
        >
          Plus Alimentés
        </button>
        <button 
          className={`tab ${activeTab === 'oct' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('oct')}
        >
          Plus Octroyés
        </button>
      </div>

      {/* Liste des produits */}
      <div className="space-y-3">
        {displayedProducts.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          displayedProducts.map((produit, index) => (
            <div
              key={produit.produitId}
              className="flex items-center gap-3 p-3 bg-base-100 hover:bg-base-200 rounded-lg transition-colors border border-base-200"
            >
              {/* Rang */}
              <div className={`badge badge-lg ${
                index === 0 ? 'badge-warning' : 
                index === 1 ? 'badge-neutral' : 
                'badge-ghost'
              }`}>
                {index + 1}
              </div>

              {/* Image */}
              {produit.imageUrl ? (
                <Image
                  src={produit.imageUrl}
                  alt={produit.produitName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-base-300 flex items-center justify-center">
                  <Package className="w-5 h-5 text-base-content/30" />
                </div>
              )}

              {/* Infos produit */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{produit.produitName}</p>
                <p className="text-xs text-base-content/60">{produit.categoryName}</p>
              </div>

              {/* Métriques */}
              <div className="text-right">
                {activeTab === 'alim' ? (
                  <>
                    <p className="font-bold text-sm text-success">
                      {produit.alimentations.quantiteTotale} {produit.produitUnit}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {produit.alimentations.valeurTotaleMRU.toFixed(0)} MRU
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-sm text-warning">
                      {produit.octrois.quantiteTotale} {produit.produitUnit}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {produit.octrois.count} octrois
                    </p>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
