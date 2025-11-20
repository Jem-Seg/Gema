'use client';

import { StructureStatistics } from '@/type';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  FileDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StructureStatisticsProps {
  structureId: string;
  initialData?: StructureStatistics;
}

export default function StructureStatisticsComponent({ structureId, initialData }: StructureStatisticsProps) {
  const [statistics, setStatistics] = useState<StructureStatistics | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres de date
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // État d'affichage
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    alimentations: true,
    octrois: true,
    products: false,
    top: true,
    alimentationsParStructure: false
  });

  // Charger les statistiques
  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/structures/${structureId}/statistics?startDate=${startDate}&endDate=${endDate}`;
      console.log('📊 Chargement des statistiques depuis:', url);
      
      const response = await fetch(url);
      console.log('📊 Réponse API status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques');
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      setStatistics(data);
    } catch (err) {
      console.error('❌ Erreur loadStatistics:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage uniquement si pas de données initiales
  useEffect(() => {
    if (!initialData) {
      loadStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonction pour exporter les données
  const exportToCSV = () => {
    if (!statistics) return;
    
    const csvRows = [];
    
    // En-tête
    csvRows.push('Structure,Ministère,Période Début,Période Fin');
    csvRows.push(`${statistics.structureName},${statistics.ministereName},${new Date(statistics.periode.debut).toLocaleDateString()},${new Date(statistics.periode.fin).toLocaleDateString()}`);
    csvRows.push('');
    
    // Vue d'ensemble
    csvRows.push('VUE D\'ENSEMBLE');
    csvRows.push('Métrique,Valeur');
    csvRows.push(`Total Alimentations,${statistics.overview.totalAlimentations}`);
    csvRows.push(`Quantité Totale Alimentations,${statistics.overview.quantiteTotaleAlimentations}`);
    csvRows.push(`Valeur Totale Alimentations (MRU),${statistics.overview.valeurTotaleAlimentationsMRU.toFixed(2)}`);
    csvRows.push(`Total Octrois,${statistics.overview.totalOctrois}`);
    csvRows.push(`Quantité Totale Octrois,${statistics.overview.quantiteTotaleOctrois}`);
    csvRows.push(`Valeur Totale Octrois (MRU),${statistics.overview.valeurTotaleOctroisMRU.toFixed(2)}`);
    csvRows.push('');
    
    // Détails par produit
    csvRows.push('DÉTAILS PAR PRODUIT');
    csvRows.push('Produit,Catégorie,Unité,Nb Alim,Qté Alim,Valeur Alim (MRU),Nb Octroi,Qté Octroi,Valeur Octroi (MRU),Stock Actuel,Taux Utilisation %,Taux Rotation');
    statistics.parProduit.forEach(p => {
      csvRows.push(`${p.produitName},${p.categoryName},${p.produitUnit},${p.alimentations.count},${p.alimentations.quantiteTotale},${p.alimentations.valeurTotaleMRU.toFixed(2)},${p.octrois.count},${p.octrois.quantiteTotale},${p.octrois.valeurTotaleMRU.toFixed(2)},${p.stock.actuel},${p.stock.tauxUtilisation.toFixed(2)},${p.stock.tauxRotation.toFixed(2)}`);
    });
    csvRows.push('');
    
    // Alimentations par produit et structure
    if (statistics.alimentationsParProduitStructure && statistics.alimentationsParProduitStructure.length > 0) {
      csvRows.push('ALIMENTATIONS PAR PRODUIT ET STRUCTURE');
      csvRows.push('Produit,Catégorie,Unité,Structure,Ministère,Nb Alim,Quantité,Valeur (MRU)');
      statistics.alimentationsParProduitStructure.forEach(produit => {
        produit.structures.forEach(struct => {
          csvRows.push(`${produit.produitName},${produit.categoryName},${produit.produitUnit},${struct.structureName},${struct.ministereAbrev},${struct.count},${struct.quantiteTotale},${struct.valeurTotaleMRU.toFixed(2)}`);
        });
        // Ligne de total pour chaque produit
        csvRows.push(`${produit.produitName},${produit.categoryName},${produit.produitUnit},TOTAL,,${produit.totaux.count},${produit.totaux.quantiteTotale},${produit.totaux.valeurTotaleMRU.toFixed(2)}`);
        csvRows.push('');
      });
    }
    
    // Télécharger le fichier
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_${statistics.structureName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="alert alert-warning">
        <span>Aucune donnée disponible</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="card-title text-2xl">{statistics.structureName}</h2>
              <p className="text-base-content/70">{statistics.ministereName}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date début</span>
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Date de début"
                  className="input input-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date fin</span>
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Date de fin"
                  className="input input-bordered"
                />
              </div>
              
              <div className="form-control">
                <label className="label opacity-0">Action</label>
                <button 
                  onClick={loadStatistics}
                  className="btn btn-primary"
                >
                  <Calendar className="w-4 h-4" />
                  Actualiser
                </button>
              </div>
              
              <div className="form-control">
                <label className="label opacity-0">Export</label>
                <button 
                  onClick={exportToCSV}
                  className="btn btn-secondary"
                >
                  <FileDown className="w-4 h-4" />
                  Exporter CSV
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-base-content/60 mt-2">
            Période : {new Date(statistics.periode.debut).toLocaleDateString('fr-FR')} - {new Date(statistics.periode.fin).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('overview')}
          >
            <h3 className="card-title">Vue d&apos;ensemble</h3>
            {expandedSections.overview ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Alimentations */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-figure text-success">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Alimentations</div>
                  <div className="stat-value text-success">{statistics.overview.totalAlimentations}</div>
                  <div className="stat-desc">{statistics.overview.quantiteTotaleAlimentations} unités</div>
                </div>
              </div>
              
              {/* Valeur Alimentations */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-figure text-success">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Valeur Alimentations</div>
                  <div className="stat-value text-success text-2xl">
                    {statistics.overview.valeurTotaleAlimentationsMRU.toFixed(2)} MRU
                  </div>
                  <div className="stat-desc">
                    {statistics.overview.alimentationsValidees} validées, {statistics.overview.alimentationsEnAttente} en attente
                  </div>
                </div>
              </div>
              
              {/* Octrois */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-figure text-warning">
                    <TrendingDown className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Octrois</div>
                  <div className="stat-value text-warning">{statistics.overview.totalOctrois}</div>
                  <div className="stat-desc">{statistics.overview.quantiteTotaleOctrois} unités</div>
                </div>
              </div>
              
              {/* Valeur Octrois */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-figure text-warning">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Valeur Octrois</div>
                  <div className="stat-value text-warning text-2xl">
                    {statistics.overview.valeurTotaleOctroisMRU.toFixed(2)} MRU
                  </div>
                  <div className="stat-desc">
                    {statistics.overview.octroiValides} validés, {statistics.overview.octroiEnAttente} en attente
                  </div>
                </div>
              </div>
              
              {/* Produits */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Produits Actifs</div>
                  <div className="stat-value text-primary">{statistics.overview.produitsDistincts}</div>
                  <div className="stat-desc">Avec activité sur la période</div>
                </div>
              </div>
              
              {/* Rejets */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-figure text-error">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Rejets</div>
                  <div className="stat-value text-error">
                    {statistics.overview.alimentationsRejetees + statistics.overview.octroiRejetes}
                  </div>
                  <div className="stat-desc">
                    {statistics.overview.alimentationsRejetees} alim, {statistics.overview.octroiRejetes} oct
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Produits */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('top')}
          >
            <h3 className="card-title">Top 5 Produits</h3>
            {expandedSections.top ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.top && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
              {/* Plus alimentés */}
              <div>
                <h4 className="font-semibold text-success mb-3">Plus Alimentés (Quantité)</h4>
                <div className="space-y-2">
                  {statistics.topProduits.plusAlimentes.map((p, idx) => (
                    <div key={p.produitId} className="flex items-center gap-2 p-2 bg-success/10 rounded">
                      <div className="badge badge-success badge-sm">{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{p.produitName}</div>
                        <div className="text-xs text-base-content/60">
                          {p.alimentations.quantiteTotale} {p.produitUnit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Plus octroyés */}
              <div>
                <h4 className="font-semibold text-warning mb-3">Plus Octroyés (Quantité)</h4>
                <div className="space-y-2">
                  {statistics.topProduits.plusOctroyes.map((p, idx) => (
                    <div key={p.produitId} className="flex items-center gap-2 p-2 bg-warning/10 rounded">
                      <div className="badge badge-warning badge-sm">{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{p.produitName}</div>
                        <div className="text-xs text-base-content/60">
                          {p.octrois.quantiteTotale} {p.produitUnit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Plus de valeur */}
              <div>
                <h4 className="font-semibold text-primary mb-3">Plus de Valeur (MRU)</h4>
                <div className="space-y-2">
                  {statistics.topProduits.plusValeurAlimentations.map((p, idx) => (
                    <div key={p.produitId} className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                      <div className="badge badge-primary badge-sm">{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{p.produitName}</div>
                        <div className="text-xs text-base-content/60">
                          {p.alimentations.valeurTotaleMRU.toFixed(2)} MRU
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Détails par produit */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('products')}
          >
            <h3 className="card-title">Détails par Produit</h3>
            {expandedSections.products ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {expandedSections.products && (
            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th className="text-center">Alim.</th>
                    <th className="text-right">Qté Alim.</th>
                    <th className="text-right">Valeur Alim. (MRU)</th>
                    <th className="text-center">Oct.</th>
                    <th className="text-right">Qté Oct.</th>
                    <th className="text-right">Valeur Oct. (MRU)</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Taux Util. %</th>
                    <th className="text-right">Rotation</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.parProduit
                    .filter(p => p.alimentations.count > 0 || p.octrois.count > 0)
                    .map(p => (
                      <tr key={p.produitId}>
                        <td>
                          <div className="flex items-center gap-2">
                            {p.imageUrl && (
                              <Image 
                                src={p.imageUrl} 
                                alt={p.produitName} 
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <span className="font-medium">{p.produitName}</span>
                          </div>
                        </td>
                        <td>{p.categoryName}</td>
                        <td className="text-center">{p.alimentations.count}</td>
                        <td className="text-right">{p.alimentations.quantiteTotale}</td>
                        <td className="text-right font-semibold text-success">
                          {p.alimentations.valeurTotaleMRU.toFixed(2)}
                        </td>
                        <td className="text-center">{p.octrois.count}</td>
                        <td className="text-right">{p.octrois.quantiteTotale}</td>
                        <td className="text-right font-semibold text-warning">
                          {p.octrois.valeurTotaleMRU.toFixed(2)}
                        </td>
                        <td className="text-right">
                          {p.stock.actuel} / {p.stock.initial}
                        </td>
                        <td className="text-right">{p.stock.tauxUtilisation.toFixed(2)}%</td>
                        <td className="text-right">{p.stock.tauxRotation.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Alimentations par Produit et Structure */}
      {statistics.alimentationsParProduitStructure && statistics.alimentationsParProduitStructure.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('alimentationsParStructure')}
            >
              <h3 className="card-title">Alimentations par Produit et Structure</h3>
              {expandedSections.alimentationsParStructure ? <ChevronUp /> : <ChevronDown />}
            </div>
            
            {expandedSections.alimentationsParStructure && (
              <div className="space-y-6 mt-4">
                {statistics.alimentationsParProduitStructure.map((produit) => (
                  <div key={produit.produitId} className="border border-base-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg">{produit.produitName}</h4>
                        <p className="text-sm text-base-content/70">{produit.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <div className="badge badge-primary badge-lg">
                          Total: {produit.totaux.quantiteTotale} {produit.produitUnit}
                        </div>
                        <div className="text-sm font-semibold text-success mt-1">
                          {produit.totaux.valeurTotaleMRU.toFixed(2)} MRU
                        </div>
                      </div>
                    </div>

                    {/* Desktop - Tableau */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr className="bg-base-200">
                            <th>Structure</th>
                            <th>Ministère</th>
                            <th className="text-center">Nb Alimentations</th>
                            <th className="text-right">Quantité</th>
                            <th className="text-right">Valeur (MRU)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produit.structures.map((struct) => (
                            <tr key={struct.structureId}>
                              <td className="font-medium">{struct.structureName}</td>
                              <td>
                                <span className="badge badge-info badge-sm">
                                  {struct.ministereAbrev}
                                </span>
                              </td>
                              <td className="text-center">{struct.count}</td>
                              <td className="text-right">
                                {struct.quantiteTotale} {produit.produitUnit}
                              </td>
                              <td className="text-right font-semibold text-success">
                                {struct.valeurTotaleMRU.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-base-200 font-bold">
                            <td colSpan={2}>Total</td>
                            <td className="text-center">{produit.totaux.count}</td>
                            <td className="text-right">
                              {produit.totaux.quantiteTotale} {produit.produitUnit}
                            </td>
                            <td className="text-right text-success">
                              {produit.totaux.valeurTotaleMRU.toFixed(2)} MRU
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Mobile - Cartes */}
                    <div className="md:hidden space-y-3">
                      {produit.structures.map((struct) => (
                        <div key={struct.structureId} className="bg-base-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold">{struct.structureName}</div>
                              <span className="badge badge-info badge-xs mt-1">
                                {struct.ministereAbrev}
                              </span>
                            </div>
                            <div className="badge badge-outline">{struct.count} alim.</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-base-content/70">Quantité</div>
                              <div className="font-semibold">
                                {struct.quantiteTotale} {produit.produitUnit}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-base-content/70">Valeur</div>
                              <div className="font-semibold text-success">
                                {struct.valeurTotaleMRU.toFixed(2)} MRU
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total mobile */}
                      <div className="bg-primary/10 border-2 border-primary rounded-lg p-3">
                        <div className="font-bold mb-2">Total</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-base-content/70">Alim.</div>
                            <div className="font-semibold">{produit.totaux.count}</div>
                          </div>
                          <div>
                            <div className="text-base-content/70">Quantité</div>
                            <div className="font-semibold">
                              {produit.totaux.quantiteTotale}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base-content/70">Valeur</div>
                            <div className="font-semibold text-success">
                              {produit.totaux.valeurTotaleMRU.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
