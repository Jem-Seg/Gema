'use client';

import { useEffect, useState } from 'react';
import { StructureStatistics } from '@/type';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendsOverviewProps {
  structureId?: string;
}

export default function TrendsOverview({ structureId }: TrendsOverviewProps) {
  const [statistics, setStatistics] = useState<StructureStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      // Attendre que structureId soit défini (peut être "" pour toutes les structures)
      if (structureId === undefined) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Derniers 30 jours
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
        console.error('Erreur chargement tendances:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [structureId]);

  if (loading) {
    return (
      <div className="border-2 border-base-200 p-6 rounded-3xl">
        <div className="skeleton h-64 w-full"></div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  // Calculer les pourcentages de validation
  const alimentationsValidationRate = statistics.overview.totalAlimentations > 0
    ? (statistics.overview.alimentationsValidees / statistics.overview.totalAlimentations) * 100
    : 0;

  const octroisValidationRate = statistics.overview.totalOctrois > 0
    ? (statistics.overview.octroiValides / statistics.overview.totalOctrois) * 100
    : 0;

  return (
    <div className="border-2 border-base-200 p-6 rounded-3xl">
      <h2 className="text-xl font-bold mb-4 text-[#793205]">
        Tendances (30 derniers jours)
      </h2>

      {/* Alimentations vs Octrois */}
      <div className="space-y-4 mb-6">
        {/* Alimentations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="font-semibold">Alimentations</span>
            </div>
            <span className="text-2xl font-bold text-success">
              {statistics.overview.totalAlimentations}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-base-content/70 mb-2">
            <span>{statistics.overview.quantiteTotaleAlimentations} unités</span>
            <span>·</span>
            <span className="font-semibold text-success">
              {statistics.overview.valeurTotaleAlimentationsMRU.toFixed(0)} MRU
            </span>
          </div>
          {/* Barre de progression validation */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: `${Math.min(100, alimentationsValidationRate)}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              {alimentationsValidationRate.toFixed(0)}% validées
            </span>
          </div>
          {/* Détails des statuts */}
          <div className="flex gap-3 mt-2 text-xs">
            <div className="badge badge-success badge-sm gap-1">
              <span className="font-semibold">{statistics.overview.alimentationsValidees}</span> validées
            </div>
            <div className="badge badge-warning badge-sm gap-1">
              <span className="font-semibold">{statistics.overview.alimentationsEnAttente}</span> en attente
            </div>
            {statistics.overview.alimentationsRejetees > 0 && (
              <div className="badge badge-error badge-sm gap-1">
                <span className="font-semibold">{statistics.overview.alimentationsRejetees}</span> rejetées
              </div>
            )}
          </div>
        </div>

        <div className="divider my-2"></div>

        {/* Octrois */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-warning" />
              <span className="font-semibold">Octrois</span>
            </div>
            <span className="text-2xl font-bold text-warning">
              {statistics.overview.totalOctrois}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-base-content/70 mb-2">
            <span>{statistics.overview.quantiteTotaleOctrois} unités</span>
            <span>·</span>
            <span className="font-semibold text-warning">
              {statistics.overview.valeurTotaleOctroisMRU.toFixed(0)} MRU
            </span>
          </div>
          {/* Barre de progression validation */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning transition-all duration-300"
                  style={{ width: `${Math.min(100, octroisValidationRate)}%` }}
                ></div>
              </div>
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              {octroisValidationRate.toFixed(0)}% validés
            </span>
          </div>
          {/* Détails des statuts */}
          <div className="flex gap-3 mt-2 text-xs">
            <div className="badge badge-success badge-sm gap-1">
              <span className="font-semibold">{statistics.overview.octroiValides}</span> validés
            </div>
            <div className="badge badge-warning badge-sm gap-1">
              <span className="font-semibold">{statistics.overview.octroiEnAttente}</span> en attente
            </div>
            {statistics.overview.octroiRejetes > 0 && (
              <div className="badge badge-error badge-sm gap-1">
                <span className="font-semibold">{statistics.overview.octroiRejetes}</span> rejetés
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ratio Alimentations/Octrois */}
      {statistics.overview.totalAlimentations > 0 && (
        <div className="bg-base-200/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ratio Alimentation/Octroi</span>
            <span className="text-lg font-bold">
              {statistics.overview.totalOctrois > 0
                ? (statistics.overview.totalAlimentations / statistics.overview.totalOctrois).toFixed(2)
                : '∞'
              }
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-1">
            {statistics.overview.totalOctrois > 0
              ? `Pour chaque octroi, il y a ${(statistics.overview.totalAlimentations / statistics.overview.totalOctrois).toFixed(1)} alimentations`
              : 'Aucun octroi enregistré'
            }
          </p>
        </div>
      )}
    </div>
  );
}
