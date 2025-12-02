'use client'
import { StockSummary } from '@/type';
import React, { useEffect, useState } from 'react';
import { getStockSummary, getUserMinistereStructures, getUserPermissionsInfo } from '../actions';
import { Package, AlertTriangle, XCircle, Filter } from 'lucide-react';
import { Ministere, Structure } from '@prisma/client';
import ProductImage from './ProductImage';
import EmptyState from './EmptyState';

type MinistereWithStructures = Ministere & {
  structures: Structure[]
}

type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
  message: string;
}

const StockSummaryTable = ({ clerkId, structureId }: { clerkId: string; structureId?: string }) => {
  const [data, setData] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string>(structureId || '');
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [availableStructures, setAvailableStructures] = useState<MinistereWithStructures[]>([]);
  const [showStructureSelector, setShowStructureSelector] = useState(false);

  // Charger les permissions et structures utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      if (!clerkId) return;

      try {
        const [permissions, structures] = await Promise.all([
          getUserPermissionsInfo(clerkId),
          getUserMinistereStructures(clerkId)
        ]);

        setUserPermissions(permissions);
        setAvailableStructures(structures || []);

        // Déterminer si l'utilisateur peut voir plusieurs structures
        const canAccessMultipleStructures = permissions?.scope === 'all' || permissions?.scope === 'ministere';
        setShowStructureSelector(canAccessMultipleStructures && structures && structures.length > 0);

        // Définir la structure par défaut si pas déjà définie
        if (!selectedStructureId && structures && structures.length > 0) {
          const firstStructure = structures[0]?.structures?.[0];
          if (firstStructure) {
            setSelectedStructureId(firstStructure.id);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données utilisateur:', error);
      }
    };

    loadUserData();
  }, [clerkId, selectedStructureId]);

  // Charger les données de stock
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!clerkId) {
          setLoading(false);
          return;
        }

        // Utiliser la structure sélectionnée ou celle fournie en prop
        const targetStructureId = selectedStructureId || structureId;
        console.log('📡 StockSummaryTable - Fetching for structure:', targetStructureId);

        const result = await getStockSummary(clerkId, targetStructureId);

        if (result) {
          setData(result);
          console.log('✅ StockSummaryTable - Data loaded successfully');
        } else {
          setError('Aucune donnée disponible pour cette structure');
        }
      } catch (error) {
        console.error('❌ StockSummaryTable - Error:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    // Ne charger que si on a un clerkId et soit une structure sélectionnée soit les permissions chargées
    if (clerkId && (selectedStructureId || userPermissions)) {
      fetchSummary();
    }
  }, [clerkId, selectedStructureId, structureId, userPermissions]);

  // Données de test pour le débogage
  const debugMode = !data && !loading && !error;

  return (
    <>
      <div className='border-2 border-base-200 p-6 rounded-3xl'>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#793205]">
            Résumé des Stocks
          </h2>
          {showStructureSelector && (
            <Filter className="w-5 h-5 text-[#793205]" />
          )}
        </div>

        {/* Sélecteur de structure pour les utilisateurs avec accès étendu */}
        {showStructureSelector && availableStructures.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par structure :
            </label>
            <select
              className="select select-bordered w-full select-sm"
              value={selectedStructureId}
              onChange={(e) => setSelectedStructureId(e.target.value)}
              title="Sélectionner une structure"
            >
              <option value="">Toutes les structures accessibles</option>
              {availableStructures.map(ministere =>
                ministere.structures?.map(structure => (
                  <option key={structure.id} value={structure.id}>
                    {ministere.name} - {structure.name}
                  </option>
                ))
              )}
            </select>
            
            {/* Indicateur de filtre actuel */}
            <div className="mt-2 text-xs text-blue-600">
              <strong>Affichage :</strong> {
                selectedStructureId === ''
                  ? 'Toutes les structures accessibles'
                  : availableStructures.find(m => 
                      m.structures?.find(s => s.id === selectedStructureId)
                    )?.structures?.find(s => s.id === selectedStructureId)
                    ? `${availableStructures.find(m => m.structures?.find(s => s.id === selectedStructureId))?.name} - ${availableStructures.find(m => m.structures?.find(s => s.id === selectedStructureId))?.structures?.find(s => s.id === selectedStructureId)?.name}`
                    : `Structure (${selectedStructureId})`
              }
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg text-[#F1D2BF]"></span>
            <span className="ml-2 text-sm text-gray-500">Chargement des statistiques...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">
            <p className="font-bold">Erreur:</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : !data && debugMode ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800 font-bold">Mode Debug</p>
            <p className="text-yellow-600 text-sm">Le composant s&apos;affiche mais aucune donnée n&apos;est disponible.</p>
            <div className="mt-2 text-xs text-yellow-500">
              clerkId: {clerkId || 'non fourni'}<br />
              structureId: {structureId || 'non fourni'}
            </div>
          </div>
        ) : !data ? (
          <div className="text-gray-500 text-center py-8">Aucune donnée disponible</div>
        ) : (
          <div className="space-y-4">
            {/* Stock Normal */}
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Stock Normal</p>
                  <p className="text-sm text-green-600">&gt; 10% du stock initial</p>
                </div>
              </div>
              <span className="badge badge-success badge-lg font-bold">
                {data.inStockCount}
              </span>
            </div>

            {/* Stock d'Alerte */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">Stock d&apos;Alerte</p>
                  <p className="text-sm text-blue-600">5% - 10% du stock initial</p>
                </div>
              </div>
              <span className="badge badge-info badge-lg font-bold">
                {data.alertStockCount}
              </span>
            </div>

            {/* Stock Faible */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">Stock Faible</p>
                  <p className="text-sm text-yellow-600">1 unité - 5% du stock initial</p>
                </div>
              </div>
              <span className="badge badge-warning badge-lg font-bold">
                {data.lowStockCount}
              </span>
            </div>

            {/* Rupture de Stock */}
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Rupture de Stock</p>
                  <p className="text-sm text-red-600">0 unités disponibles</p>
                </div>
              </div>
              <span className="badge badge-error badge-lg font-bold">
                {data.outOfStockCount}
              </span>
            </div>

            {/* Produits Critiques */}
            {data.criticalProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-sm mb-3 text-[#793205]">
                  Produits Nécessitant une Attention ({data.criticalProducts.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {data.criticalProducts.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px]">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.categoryName}</p>
                      </div>
                      <span className={`badge badge-sm ${product.quantity === 0 ? 'badge-error' : 'badge-warning'
                        }`}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                  ))}
                  {data.criticalProducts.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{data.criticalProducts.length - 3} autre(s) produit(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className='border-2 border-base-300 w-full p-4 rounded-3xl mt-4 bg-base-100 shadow-lg'>
        <h2 className='text-xl font-bold mb-4'>Produits critiques</h2>
        {data && data.criticalProducts.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className='table'>
              <thead>
                <tr className="bg-primary text-primary-content">
                  <th className="text-sm font-semibold">#</th>
                  <th className="text-sm font-semibold">Image</th>
                  <th className="text-sm font-semibold">Nom</th>
                  <th className="text-sm font-semibold">Quantité</th>
              </tr>
            </thead>
            <tbody>
              {data?.criticalProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                  <th>{index + 1}</th>
                  <td>
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.imageUrl}
                      heightClass='h-12'
                      widthClass='w-12'
                    />
                  </td>
                  <td>{product.name}
                  </td>
                  <td className='capitalize'>
                    {product.quantity} {product.unit}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <EmptyState
            iconComponent='PackageSearch'
            message="Aucun produit critique"
          />
        )}
      </div>
    </>
  );
}

export default StockSummaryTable;
