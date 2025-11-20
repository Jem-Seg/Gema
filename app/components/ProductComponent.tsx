import React from 'react'
import { Produit } from '@/type';
import ProductImage from './ProductImage';
import { Plus } from 'lucide-react';


interface ProductComponentProps {
  product?: Produit | null;
  add?: boolean;
  handleAddToCart?: (product: Produit) => void;
}
const ProductComponent: React.FC<ProductComponentProps> = ({ product, add, handleAddToCart }) => {

  if (!product) {
    return (
      <div className='border-2 border-base-200 p-4 rounded-3xl w-full flex items-center'>
        Sélectionner un produit pour voir ses détails
      </div>
    )
  }
  return (
    <div className='border-2 border-base-200 p-4 rounded-3xl w-full flex items-center'>
      <div>
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          widthClass='w-30'
          heightClass='h-30'

        />
      </div>
      <div className='ml-4 space-y-2 flex flex-col'>
        <h2 className='text-lg font-bold'>{product.name}</h2>
        <div className='badge badge-warning badge-soft'>
          {product.categoryName || 'Catégorie inconnue'}
        </div>
        <div className='badge badge-warning badge-soft'>
          {product.quantity} {product.unit}
        </div>
        {add && handleAddToCart && (
          <button
            onClick={() => handleAddToCart(product)}
            className='btn btn-sm btn-circle btn-primary'
            aria-label={`Ajouter ${product.name} au panier`}
            title={`Ajouter ${product.name} au panier`}
          >
            <Plus className='w-4 h-4' />
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductComponent
