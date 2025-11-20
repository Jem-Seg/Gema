import { ProductOverviewStats } from '@/type';
import React, { useEffect, useState } from 'react';
import { getProductOverviewStats } from '../actions';
import { Box, DollarSign, ShoppingCart, Tag } from 'lucide-react';

const ProductOverview = ({ clerkId, structureId }: { clerkId: string; structureId?: string }) => {
  const [stats, setStats] = useState<ProductOverviewStats | null>(null);

  function formatNumber(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return value.toFixed(1);
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔍 Fetching stats for clerkId:', clerkId, 'structureId:', structureId);
        if (clerkId) {
          const result = await getProductOverviewStats(clerkId, structureId);
          console.log('📊 Result from getProductOverviewStats:', result);
          if (result) {
            setStats(result);
            console.log('✅ Stats set successfully');
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques du produit:', error);
      }
    };

    fetchStats();
  }, [clerkId, structureId]);

  return (
    <div>
      {stats ? (
        <div className='grid grid-cols-2 gap-4'>
          <div className='border-2 p-4 border-base-200 rounded-3xl'>
            <p className='stat-title'>Produits en stock</p>
            <div className='flex justify-between items-center'>
              <div className='stat-value'>{stats.overview.totalProducts}</div>
              <div className='bg-primary/25 p-3 rounded-full'>
                <Box className='w-5 h-5 text-primary text-3xl' />
              </div>
            </div>
          </div>

          <div className='border-2 p-4 border-base-200 rounded-3xl'>
            <p className='stat-title'>Nombre de catégories</p>
            <div className='flex justify-between items-center'>
              <div className='stat-value'>{stats.overview.totalCategories}</div>
              <div className='bg-primary/25 p-3 rounded-full'>
                <Tag className='w-5 h-5 text-primary text-3xl' />
              </div>
            </div>
          </div>

          <div className='border-2 p-4 border-base-200 rounded-3xl'>
            <p className='stat-title'>Valeur totale du stock</p>
            <div className='flex justify-between items-center'>
              <div className='stat-value'>{formatNumber(stats.overview.stockValue)} MRU </div>
              <div className='bg-primary/25 p-3 rounded-full'>
                <DollarSign className='w-5 h-5 text-primary text-3xl' />
              </div>
            </div>
          </div>

          <div className='border-2 p-4 border-base-200 rounded-3xl'>
            <p className='stat-title'>Total des transactions</p>
            <div className='flex justify-between items-center'>
              <div className='stat-value'>{stats.overview.totalTransactions}</div>
              <div className='bg-primary/25 p-3 rounded-full'>
                <ShoppingCart className='w-5 h-5 text-primary text-3xl' />
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className='flex justify-center items-center w-full'>
          <span className="loading loading-spinner loading-xl"></span>
        </div>
      )}
    </div>
  )
}

export default ProductOverview;
