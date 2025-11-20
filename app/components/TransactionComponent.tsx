import { Transaction } from '@/type'
import React from 'react'
import ProductImage from './ProductImage'

const TransactionComponent = ({ tx }: { tx: Transaction }) => {
  const formattedDate = new Date(tx.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',

  })
  return (
    <div className='p-4 bg-white border-2 border-[#F1D2BF] rounded-xl flex items-center w-full shadow-md hover:shadow-lg transition-shadow'>
      <div>
        {tx.imageUrl && (
          <ProductImage
            src={tx.imageUrl}
            alt={tx.imageUrl}
            widthClass='w-14'
            heightClass='h-14'
          />
        )}
      </div>
      <div className='ml-4 flex justify-between w-full items-center'>
        <div>
          <p className='font-semibold text-base text-[#793205]'>{tx.productName || 'Nom du produit non disponible'}</p>
          <div className='badge bg-amber-100 text-amber-700 border-amber-300 mt-2 text-xs'>{tx.categoryName}</div>
        </div>
        <div className='flex flex-end flex-col'>
          <div className='text-right'>
            <div>
              {tx.type == 'IN' ? (
                <div>
                  <span className='text-green-600 font-bold text-lg capitalize'>
                    + {tx.quantity} {tx.unit}
                  </span>
                </div>
              ) : (
                <div>
                  <span className='text-red-600 font-bold text-lg capitalize'>
                    - {tx.quantity} {tx.unit}
                  </span>
                </div>
              )}
            </div>
            <div className='text-xs text-base-content/60 mt-1'>
              {formattedDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionComponent
