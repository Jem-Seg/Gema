'use client'
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useSession } from 'next-auth/react';
import { Produit } from '@/type';
import { OrderItem } from '@/type';
import { deductStockWithTransaction, readProduct, getUserPermissionsInfo, getUserMinistereStructures } from '../actions';
import ProductComponent from '../components/ProductComponent';
import EmptyState from '../components/EmptyState';
import ProductImage from '../components/ProductImage';
import { Trash } from 'lucide-react';
import { toast } from 'react-toastify';


const GivePage = () => {

  const { data: session, status } = useSession();
  const user = session?.user;
  const [products, setProducts] = useState<Produit[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState<{ canCreate: boolean, canRead: boolean, scope: string } | null>(null);
  const [userData, setUserData] = useState<{ structureId: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Charger les permissions utilisateur
  useEffect(() => {
    if (!(user as any)?.id) return;

    const loadUserPermissions = async () => {
      try {
        const permissions = await getUserPermissionsInfo((user as any).id);
        const structures = await getUserMinistereStructures((user as any).id);

        console.log('🔍 Permissions:', permissions.scope, '- Structures trouvées:', structures.length);

        setUserPermissions(permissions);

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
    const fetchProducts = async () => {
      try {
        if (userData?.structureId) {
          setLoading(true);
          const products = await readProduct(userData.structureId);

          if (products && products.length > 0) {
            setProducts(products);
            console.log('✅ Produits chargés:', products.length, 'produits disponibles');
          } else {
            console.log('⚠️ Aucun produit trouvé dans cette structure');
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('❌ Erreur récupération produits:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.structureId) {
      fetchProducts();
    }
  }, [userData?.structureId]);

  const filteredAvailableProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((product) => !selectedProductIds.includes(product.id))
    .slice(0, 10);

  // Debug: Afficher info sur les produits disponibles
  if (products.length === 0 && !loading) {
    console.log('⚠️ Aucun produit disponible pour cette structure');
  }

  const handleAddToCart = (products: Produit) => {
    setOrder((prevOrder) => {
      const existingProduct = prevOrder.find(item => item.productId === products.id);
      let updatedOrder
      if (existingProduct) {
        updatedOrder = prevOrder.map((item) =>
          item.productId === products.id ? {
            ...item,
            quantity: Math.min(item.quantity + 1, products.quantity)
          } : item

        )
      } else {
        updatedOrder = [
          ...prevOrder,
          {
            productId: products.id,
            quantity: 1,
            unit: products.unit,
            imageUrl: products.imageUrl,
            name: products.name,
            availableQuantity: products.quantity
          }
        ]
      }

      setSelectedProductIds((prevSelected) =>
        prevSelected.includes(products.id)
          ? prevSelected
          : [...prevSelected, products.id]
      )
      return updatedOrder
    })
  }
  const handleQuantityChange = (productId: string, quantity: number) => {
    // Permettre les valeurs temporaires pendant la saisie (NaN, 0, etc.)
    if (isNaN(quantity) || quantity === 0) {
      // Mettre à jour avec la valeur temporaire mais ne pas valider
      setOrder((prevOrder) =>
        prevOrder.map((item) =>
          item.productId === productId ? { ...item, quantity: isNaN(quantity) ? 0 : quantity } : item
        )
      )
      return
    }

    const item = order.find(i => i.productId === productId)

    if (quantity < 1) {
      toast.warning('La quantité doit être au moins 1')
      return
    }

    if (item && quantity > (item.availableQuantity || 0)) {
      toast.warning(`Stock insuffisant. Maximum disponible : ${item.availableQuantity || 0}`)
      return
    }

    setOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveFromCart = (productId: string) => {
    setOrder((prevOrder) => {
      const updatedOrder = prevOrder.filter(item => item.productId !== productId);
      setSelectedProductIds((prevSelected) =>
        prevSelected.filter(id => id !== productId)
      );
      return updatedOrder
    })
  }

  const refreshProducts = async () => {
    try {
      if (userData?.structureId) {
        const products = await readProduct(userData.structureId)
        if (products) {
          setProducts(products);
        }
      }
    } catch (error) {
      console.error('Erreur récupération produits:', error);
    }
  }

  const handleSubmitClick = () => {
    if (order.length === 0) {
      toast.error("Veuillez ajouter des produits à l'octroi");
      return
    }
    setShowConfirmation(true);
  }

  const handleConfirmOctroi = async () => {
    try {
      if (!userData?.structureId) {
        toast.error("Erreur: Structure utilisateur introuvable");
        return;
      }

      const response = await deductStockWithTransaction(order, userData.structureId);
      if (response?.success) {
        toast.success("L'octroi a été effectué avec succès");
        setOrder([]);
        setSelectedProductIds([]);
        setShowConfirmation(false);
        refreshProducts();
      } else {
        toast.error(`${response?.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'octroi:', error);
    }
  }


  // Affichage conditionnel pour le chargement
  if (!user) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">Connexion en cours...</p>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (loading || !userData) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">Chargement des produits...</p>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🤝 Gestion des Octrois</h1>
        <p className="text-base-content/70">Sélectionnez des produits pour effectuer un octroi</p>
      </div>
      <div className='flex md:flex-row flex-col-reverse'>
        <div className='md:w-1/3'>
          <label htmlFor='search-input' className='sr-only'>
            Rechercher un produit
          </label>
          <input
            type='text'
            placeholder='Rechercher un produit...'
            className='input input-bordered w-full mb-4'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className='space-y-4'>
            {filteredAvailableProducts.length > 0 ? (
              filteredAvailableProducts.map((product, index) => (
                <ProductComponent
                  key={index}
                  add={true}
                  product={product}
                  handleAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <div>
                <EmptyState
                  iconComponent={'PackageSearch'}
                  message="Aucun produit trouvé"
                />
              </div>
            )}
          </div>
        </div>
        <div className='md:w-2/3 p-4 md:ml-4 mb-4 md:mb-0 h-fit border-2 border-base-300 rounded-3xl overflow-x-auto bg-base-100 shadow-xl'>
          {order.length > 0 ? (
            <div>
              <table className='table w-full'>
                <thead>
                  <tr className="bg-primary text-primary-content">
                    <th className="text-sm font-semibold">Image</th>
                    <th className="text-sm font-semibold">Nom</th>
                    <th className="text-sm font-semibold">Quantité</th>
                    <th className="text-sm font-semibold">Unité</th>
                    <th className="text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {order.map((item) => (
                    <tr key={item.productId} className="hover:bg-base-200 transition-colors border-b border-base-300">
                      <td>
                        <ProductImage
                          src={item.imageUrl || ''}
                          alt={item.name || 'Produit'}
                          heightClass='h-12'
                          widthClass='w-12'
                        />
                      </td>
                      <td>
                        {item.name}
                      </td>
                      <td>
                        <input
                          type='number'
                          value={item.quantity || ''}
                          min='1'
                          max={item.availableQuantity}
                          placeholder='Quantité'
                          className='input input-bordered w-20'
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              handleQuantityChange(item.productId, 0)
                            } else {
                              handleQuantityChange(item.productId, Number(value))
                            }
                          }}
                          onBlur={(e) => {
                            // Validation finale quand l'utilisateur quitte le champ
                            const value = Number(e.target.value)
                            if (value < 1) {
                              handleQuantityChange(item.productId, 1)
                            }
                          }}
                        />
                      </td>
                      <td className='capitalize'>
                        {item.unit}
                      </td>
                      <td>
                        <button
                          className='btn btn-sm btn-error'
                          onClick={() => handleRemoveFromCart(item.productId)}
                          title="Retirer du panier"
                        >
                          <Trash className='w-4 h-4' />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Récapitulatif des totaux */}
              <div className="alert alert-info mt-4">
                <span>
                  📦 {order.length} produit(s) • {order.reduce((sum, item) => sum + item.quantity, 0)} unité(s) au total
                </span>
              </div>

              <button
                onClick={handleSubmitClick}
                className='btn btn-primary mt-4 w-fit'
              >
                Faire l&apos;octroi
              </button>
            </div>
          ) : (
            <EmptyState
              iconComponent={'ShoppingCart'}
              message="Aucun produit dans le panier"
            />
          )}
        </div>
      </div>

      {/* Modal de confirmation d'octroi */}
      {showConfirmation && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">🤝 Confirmer l&apos;Octroi</h3>

            <div className="mb-4">
              <p className="mb-3">Vous êtes sur le point d&apos;effectuer un octroi de :</p>
              <div className="bg-base-200 p-4 rounded-lg">
                {order.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center py-2">
                    <span>{item.name}</span>
                    <span className="font-semibold">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-bold">
                  Total : {order.reduce((sum, item) => sum + item.quantity, 0)} unité(s)
                </div>
              </div>
            </div>

            <div className="alert alert-warning mb-4">
              <span>⚠️ Cette action va déduire les quantités du stock disponible.</span>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirmation(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmOctroi}
              >
                Confirmer l&apos;octroi
              </button>
            </div>
          </div>
        </dialog>
      )}
    </Wrapper>
  )
}

export default GivePage
