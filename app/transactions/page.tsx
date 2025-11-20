'use client'
import React, { useEffect, useState } from 'react'
import { getTransactions, getUserMinistereStructures, readProduct } from '../actions';
import { Produit, Transaction } from '@/type';
import Wrapper from '../components/Wrapper';
import { useSession } from 'next-auth/react';
import EmptyState from '../components/EmptyState';
import TransactionComponent from '../components/TransactionComponent';
import StructureSelector from '../components/StructureSelector';
import { RotateCcw, Receipt } from 'lucide-react';

const ITEMS_PER_PAGE = 20;
const Page = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [userPermissions, setUserPermissions] = useState(null);
  const [userData, setUserData] = useState<{ structureId: string } | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);



  // Charger les permissions utilisateur
  useEffect(() => {
    if (!(user as any)?.id) return;

    const loadUserPermissions = async () => {
      try {
        const structures = await getUserMinistereStructures((user as any).id);

        console.log('🔍 Structures trouvées:', structures.length);

        setUserPermissions(null);
        // Trouver les données utilisateur avec structureId
        if (structures && structures.length > 0) {
          const firstMinistere = structures[0];
          if (firstMinistere.structures && firstMinistere.structures.length > 0) {
            const userStructure = firstMinistere.structures[0];
            setUserData({ structureId: userStructure.id });
            console.log('✅ Structure utilisateur:', userStructure.name, '(ID:', userStructure.id, ')');
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement permissions:', error);
      }
    };

    loadUserPermissions();
  }, [(user as any)?.id]);

  // Charger les produits une fois que userData est disponible
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!(user as any)?.id) return;

        setLoading(true);

        // Utiliser la structure sélectionnée ou celle par défaut
        // Si selectedStructureId est '' (toutes les structures) ou undefined, passer undefined à getTransactions
        const targetStructureId = selectedStructureId === '' ? undefined : (selectedStructureId || userData?.structureId);

        console.log('🔍 Chargement des données pour la structure:', targetStructureId || 'TOUTES');

        // Charger les transactions (getTransactions gère le cas undefined pour "toutes les structures")
        const txs = await getTransactions((user as any).id, targetStructureId);

        if (txs) {
          setTransactions(txs);
          console.log('📋 Transactions chargées:', txs.length);
          console.log('🔍 Première transaction:', txs[0]);
        }

        // Charger les produits seulement si une structure spécifique est sélectionnée
        if (targetStructureId) {
          const products = await readProduct(targetStructureId);
          if (products && products.length > 0) {
            setProducts(products);
            console.log('✅ Produits chargés:', products.length, 'produits disponibles');
            console.log('📦 Premiers produits:', products.slice(0, 3).map(p => ({ id: p.id, name: p.name })));
          } else {
            console.log('⚠️ Aucun produit trouvé dans cette structure');
            setProducts([]);
          }
        } else {
          // Pour "toutes les structures", on pourrait charger tous les produits accessibles
          // Pour l'instant, on laisse vide car le filtre par produit n'est pas pertinent
          setProducts([]);
        }
      } catch (error) {
        console.error('❌ Erreur récupération données:', error);
        setProducts([]);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    // Exécuter fetchData si l'utilisateur est disponible
    // On n'attend plus userData?.structureId car on peut afficher toutes les structures
    if ((user as any)?.id) {
      fetchData();
    }
  }, [selectedStructureId, (user as any)?.id, userData?.structureId]);

  // Écouter les événements de mise à jour du stock (depuis validations d'octrois/alimentations)
  useEffect(() => {
    const handleStockUpdate = async () => {
      // Recharger les transactions quand le stock est mis à jour
      if (!(user as any)?.id) return;

      try {
        const targetStructureId = selectedStructureId === '' ? undefined : (selectedStructureId || userData?.structureId);
        const txs = await getTransactions((user as any).id, targetStructureId);

        if (txs) {
          setTransactions(txs);
          console.log('🔄 Transactions rechargées après mise à jour du stock:', txs.length);
        }

        // Recharger aussi les produits pour mettre à jour les quantités
        if (targetStructureId) {
          const products = await readProduct(targetStructureId);
          if (products && products.length > 0) {
            setProducts(products);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du rechargement des transactions:', error);
      }
    };

    // Ajouter l'écouteur d'événement personnalisé
    window.addEventListener('stockUpdated', handleStockUpdate);

    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, [(user as any)?.id, selectedStructureId, userData?.structureId]);

  useEffect(() => {
    let filtered = transactions;
    if (selectedProduct) {
      filtered = filtered.filter(tx => tx.produitId === selectedProduct);
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      filtered = filtered.filter(tx => new Date(tx.createdAt) <= toDate);
    }
    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedProduct, transactions, dateFrom, dateTo]);
  // Calculate pagination values
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  return (
    <Wrapper>
      {/* Header avec style retro */}
      <div className="mb-6">
        <div className="bg-linear-to-r from-[#8B4513] via-[#A0522D] to-[#CD853F] rounded-2xl shadow-2xl p-6 border-2 border-[#F1D2BF]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/20">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#FFF8DC]">Transactions</h1>
                <p className="text-[#F5DEB3] text-sm mt-1">Historique complet des mouvements de stock</p>
              </div>
            </div>
            <div className="stats shadow-lg bg-white/10 border border-white/20">
              <div className="stat p-4">
                <div className="stat-title text-[#F5DEB3] text-xs">Total</div>
                <div className="stat-value text-white text-2xl">{filteredTransactions.length}</div>
                <div className="stat-desc text-[#FFF8DC]/80 text-xs">transactions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de structure pour les utilisateurs avec accès étendu */}
      {(user as any)?.id && (
        <StructureSelector
          clerkId={(user as any).id}
          selectedStructureId={selectedStructureId}
          onStructureChange={setSelectedStructureId}
          showCurrentFilter={true}
        />
      )}

      {/* Filtres avec style retro */}
      <div className='bg-base-100 rounded-lg shadow-lg p-4 mb-6 border-2 border-[#F1D2BF]'>
        <div className='flex flex-col md:flex-row gap-4 items-center'>
          <div className='flex-1 w-full md:w-auto'>
            <label className='label'>
              <span className='label-text font-semibold text-[#793205]'>Produit</span>
            </label>
            <select
              aria-label="Filter transactions"
              className='select select-bordered w-full bg-white border-[#F1D2BF] focus:border-[#793205]'
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Tous les produits</option>
              {loading ? (
                <option disabled>Chargement des produits...</option>
              ) : products.length === 0 ? (
                <option disabled>Aucun produit disponible</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className='flex-1 w-full md:w-auto'>
            <label className='label'>
              <span className='label-text font-semibold text-[#793205]'>Date de début</span>
            </label>
            <input
              type='text'
              placeholder='Sélectionner'
              className='input input-bordered w-full bg-white border-[#F1D2BF] focus:border-[#793205]'
              value={dateFrom}
              onFocus={(e) => e.target.type = "date"}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = 'text'
              }}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className='flex-1 w-full md:w-auto'>
            <label className='label'>
              <span className='label-text font-semibold text-[#793205]'>Date de fin</span>
            </label>
            <input
              type='text'
              placeholder='Sélectionner'
              className='input input-bordered w-full bg-white border-[#F1D2BF] focus:border-[#793205]'
              value={dateTo}
              onFocus={(e) => e.target.type = "date"}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = 'text'
              }}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className='md:mt-8'>
            <button
              className='btn bg-[#793205] hover:bg-[#5a2404] text-white w-full md:w-auto'
              aria-label="Réinitialiser les filtres"
              onClick={() => {
                setSelectedProduct("")
                setDateTo("")
                setDateFrom("")
              }}
            >
              <RotateCcw className='w-4 h-4' />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className='w-full text-center py-8'>
          <span className='loading loading-spinner loading-lg'></span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          iconComponent="FileText"
          message="Aucune transaction trouvée"
        />
      ) : (
        <div className='space-y-4 w-full'>
          {paginatedTransactions.map((tx) => (
            <TransactionComponent key={tx.id} tx={tx} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredTransactions.length > ITEMS_PER_PAGE && (
        <div className='w-full flex justify-center mt-6'>
          <div className='join shadow-lg'>
            <button
              className='btn join-item bg-white hover:bg-[#F1D2BF] border-[#793205]'
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button className='btn join-item bg-[#793205] text-white border-[#793205]'>
              Page {currentPage} / {totalPages}
            </button>
            <button
              className='btn join-item bg-white hover:bg-[#F1D2BF] border-[#793205]'
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

export default Page
