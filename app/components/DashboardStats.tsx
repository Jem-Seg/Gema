'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { StructureStatistics } from '@/type';

interface DashboardStatsProps {
  structureId?: string;
}

export default function DashboardStats({ structureId }: DashboardStatsProps) {
  const [statistics, setStatistics] = useState<StructureStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!structureId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Derniers 30 jours par défaut
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const url = `/api/structures/${structureId}/statistics?startDate=${startDate}&endDate=${endDate}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques');
        }

        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        console.error('Erreur chargement stats dashboard:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [structureId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat bg-base-100 shadow rounded-lg">
            <div className="skeleton h-20 w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !statistics) {
    return null; // Masquer silencieusement en cas d'erreur
  }

  const stats = [
    {
      title: 'Alimentations (30j)',
      value: statistics.overview.totalAlimentations,
      subtitle: `${statistics.overview.quantiteTotaleAlimentations} unités`,
      valueSecondary: `${statistics.overview.valeurTotaleAlimentationsMRU.toFixed(0)} MRU`,
      icon: TrendingUp,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
      trend: statistics.overview.alimentationsValidees > 0 ? '+' + statistics.overview.alimentationsValidees : undefined,
      trendLabel: 'validées'
    },
    {
      title: 'Octrois (30j)',
      value: statistics.overview.totalOctrois,
      subtitle: `${statistics.overview.quantiteTotaleOctrois} unités`,
      valueSecondary: `${statistics.overview.valeurTotaleOctroisMRU.toFixed(0)} MRU`,
      icon: TrendingDown,
      iconColor: 'text-warning',
      bgColor: 'bg-warning/10',
      trend: statistics.overview.octroiValides > 0 ? '+' + statistics.overview.octroiValides : undefined,
      trendLabel: 'validés'
    },
    {
      title: 'Produits Actifs',
      value: statistics.overview.produitsDistincts,
      subtitle: 'avec mouvements',
      icon: Package,
      iconColor: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      title: 'En Attente',
      value: statistics.overview.alimentationsEnAttente + statistics.overview.octroiEnAttente,
      subtitle: `${statistics.overview.alimentationsEnAttente} alim. · ${statistics.overview.octroiEnAttente} oct.`,
      icon: statistics.overview.alimentationsEnAttente + statistics.overview.octroiEnAttente > 0 ? AlertTriangle : CheckCircle,
      iconColor: statistics.overview.alimentationsEnAttente + statistics.overview.octroiEnAttente > 0 ? 'text-error' : 'text-success',
      bgColor: statistics.overview.alimentationsEnAttente + statistics.overview.octroiEnAttente > 0 ? 'bg-error/10' : 'bg-success/10'
    }
  ];

  return (
    <div className="mb-6">
      {/* Titre et période */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Statistiques des 30 derniers jours</h2>
        {statistics.structureName && (
          <span className="text-sm text-base-content/60">
            {statistics.structureName}
          </span>
        )}
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="stat bg-base-100 shadow-lg rounded-lg border border-base-200">
            <div className="stat-figure">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="stat-title text-sm">{stat.title}</div>
            <div className="stat-value text-2xl">{stat.value}</div>
            <div className="stat-desc text-xs">
              {stat.subtitle}
              {stat.trend && (
                <div className="badge badge-sm badge-success gap-1 mt-1">
                  {stat.trend} {stat.trendLabel}
                </div>
              )}
            </div>
            {stat.valueSecondary && (
              <div className="stat-desc font-semibold text-primary mt-1">
                {stat.valueSecondary}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top 3 produits les plus alimentés */}
      {statistics.topProduits.plusAlimentes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 text-base-content/70">
            🔝 Top 3 Produits Alimentés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {statistics.topProduits.plusAlimentes.slice(0, 3).map((produit, index) => (
              <div
                key={produit.produitId}
                className="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-200 hover:shadow-md transition-shadow"
              >
                <div className={`badge badge-lg ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-neutral' : 'badge-ghost'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{produit.produitName}</p>
                  <p className="text-xs text-base-content/60">
                    {produit.alimentations.quantiteTotale} {produit.produitUnit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-success">
                    {produit.alimentations.valeurTotaleMRU.toFixed(0)} MRU
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
