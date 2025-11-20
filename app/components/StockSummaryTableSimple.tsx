'use client'
import React from 'react';

const StockSummaryTableSimple = ({ clerkId, structureId }: { clerkId: string; structureId?: string }) => {
  return (
    <div className='border-2 border-base-200 p-6 rounded-3xl'>
      <h2 className="text-xl font-bold mb-4 text-[#793205]">
        Résumé des Stocks (Version Simple)
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <p className="font-semibold text-green-800">Stock Normal</p>
            <p className="text-sm text-green-600">Plus de 5 unités</p>
          </div>
          <span className="badge badge-success badge-lg font-bold">5</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div>
            <p className="font-semibold text-yellow-800">Stock Faible</p>
            <p className="text-sm text-yellow-600">1 à 2 unités</p>
          </div>
          <span className="badge badge-warning badge-lg font-bold">3</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
          <div>
            <p className="font-semibold text-red-800">Rupture de Stock</p>
            <p className="text-sm text-red-600">0 unités disponibles</p>
          </div>
          <span className="badge badge-error badge-lg font-bold">2</span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        clerkId: {clerkId?.substring(0, 8)}..., structureId: {structureId || 'none'}
      </div>
    </div>
  );
}

export default StockSummaryTableSimple;