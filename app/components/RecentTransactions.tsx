import { Transaction } from '@/type';
import React, { useEffect, useState } from 'react';
import { getTransactions } from '../actions';
import EmptyState from './EmptyState';
import TransactionComponent from './TransactionComponent';

const RecentTransactions = ({ clerkId, structureId }: { clerkId: string; structureId?: string }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Modifier pour passer clerkId et structureId optionnel
        const txs = await getTransactions(clerkId, structureId, 10);

        if (txs) {
          setTransactions(txs);
        }
      } catch (error) {
        console.error('❌ Erreur récupération données:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clerkId, structureId]);


  return (

    <div className='w-full border-2 border-base-200 mt-4 p-4 rounded-3xl'>
      {loading ? (
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-md"></div>
          <p className="text-gray-500 mt-2">Chargement des transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          iconComponent="CaptionsOff"
          message='Aucune transaction récente'
        />
      ) : (
        <div className=''>
          <h2 className='text-xl font-bold mb-4'>Les 10 dernières transactions</h2>
          <div className='space-y-4'>
            {transactions.map((tx) => (
              <TransactionComponent key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
