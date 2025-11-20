'use client'
import React from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Wrapper from '../components/Wrapper'
import { getUserPermissionsInfo, getUserMinistereStructures, readProduct, deleteProduct, getAllProductsWithDetails } from '../actions'
import { Produit } from '@/type'
import EmptyState from '../components/EmptyState'
import Link from 'next/link'
import { Trash } from 'lucide-react'
import { toast } from 'react-toastify'
import { getStockStatus } from '@/lib/stock-utils'

type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
  message: string;
}

type UserData = {
  structureId?: string;
  structureName?: string;
  ministereId?: string;
  isAdmin?: boolean;
  role?: {
    name: string;
  };
}

const ProductsPage = () => {
  const { data: session, status } = useSession()
  const user = session?.user
  const [userPermissions, setUserPermissions] = React.useState<UserPermissions | null>(null)
  const [userData, setUserData] = React.useState<UserData | null>(null)

  // Charger les informations de permissions de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissionsInfo((user as any).id);
        setUserPermissions(permissions);

        // Récupérer aussi les structures de l'utilisateur pour avoir l'ID
        const userStructures = await getUserMinistereStructures((user as any).id);
        if (userStructures && userStructures.length > 0) {
          // Si c'est un agent de saisie, prendre sa structure
          // Sinon prendre la première structure disponible
          const firstStructure = userStructures[0]?.structures?.[0];
          if (firstStructure) {
            setUserData({
              structureId: firstStructure.id,
              structureName: firstStructure.name,
              ministereId: userStructures[0]?.id
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
      }
    };
    loadPermissions();
  }, [status === 'authenticated', user])

  // Charger les structures disponibles pour le filtrage
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;
    if (!userPermissions || userPermissions.scope === 'structure') return; // Pas besoin de filtrage si scope = structure

    const loadStructures = async () => {
      try {
        const userStructures = await getUserMinistereStructures((user as any).id);
        // Aplatir la liste des structures de tous les ministères
        const allStructures = userStructures.flatMap(m => 
          m.structures?.map(s => ({ ...s, ministereName: m.name, ministereAbrev: m.abreviation })) || []
        );
        setStructures(allStructures);
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
      }
    };
    loadStructures();
  }, [status, user, userPermissions]);

  const [products, setProducts] = React.useState<Produit[]>([])

  // État pour le filtrage par structure
  const [structures, setStructures] = React.useState<any[]>([])
  const [selectedStructureFilter, setSelectedStructureFilter] = React.useState<string>('ALL')

  // Fonction pour charger les produits (réutilisable)
  const loadProducts = React.useCallback(async () => {
    if (!(user as any)?.id || !userPermissions) return;

    try {
      // Si l'utilisateur a accès au scope "ministere" ou "all", utiliser la fonction globale
      if (userPermissions.scope === "ministere" || userPermissions.scope === "all") {
        const products = await getAllProductsWithDetails((user as any).id);
        setProducts(products);
      }
      // Sinon, utiliser la fonction par structure
      else if (userPermissions.scope === "structure" && userData?.structureId) {
        const products = await readProduct(userData.structureId);
        setProducts(products);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      setProducts([]);
    }
  }, [user, userPermissions, userData]);

  // Charger les produits selon les permissions de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id || !userPermissions) return;
    loadProducts();
  }, [status === 'authenticated', user, userPermissions, userData?.structureId, loadProducts]);

  // Écouter les événements de mise à jour du stock
  React.useEffect(() => {
    const handleStockUpdate = () => {
      // Recharger les produits quand le stock est mis à jour
      loadProducts();
    };

    // Ajouter l'écouteur d'événement personnalisé
    window.addEventListener('stockUpdated', handleStockUpdate);

    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, [loadProducts]);

  // Filtrer les produits par structure sélectionnée
  const getFilteredProducts = () => {
    if (selectedStructureFilter === 'ALL') {
      return products;
    }
    return products.filter(p => p.structureId === selectedStructureFilter);
  };

  const handleDeleteProduct = async (product: Produit) => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?");
    if (!confirmDelete) return;

    try {
      // Validation du format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(product.id)) {
        toast.error('Erreur: Format d\'identifiant produit invalide');
        return;
      }

      // Supprimer d'abord le produit de la base de données
      // Utiliser la structureId du produit lui-même
      const structureIdToUse = userData?.structureId || product.structureId;
      if (structureIdToUse && (user as any)?.id) {
        await deleteProduct(product.id, structureIdToUse, (user as any).id);

        // Ensuite essayer de supprimer l'image si elle existe
        if (product.imageUrl) {
          try {
            const resDelete = await fetch('/api/upload/delete', {
              method: 'DELETE',
              body: JSON.stringify({ path: product.imageUrl }),
              headers: { 'Content-Type': 'application/json' }
            });
            const dataDelete = await resDelete.json();
            if (!resDelete.ok) {
              console.warn('Erreur lors de la suppression de l\'image:', dataDelete.error);
            }
          } catch (imageError) {
            console.warn('Erreur lors de la suppression de l\'image:', imageError);
            // On continue même si l'image n'a pas pu être supprimée
          }
        }

        // Mettre à jour la liste des produits après suppression
        const updatedProducts = products.filter((p) => p.id !== product.id);
        setProducts(updatedProducts);
        toast.success('Produit supprimé avec succès');
      }

    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestion des Produits</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="badge badge-primary">
                {getFilteredProducts().length} produit{getFilteredProducts().length > 1 ? 's' : ''}
              </div>
              {userPermissions && (
                <div className="text-sm text-base-content/70">
                  {userPermissions.scope === "structure"
                    ? `Structure : ${userData?.structureName || 'Chargement...'}`
                    : userPermissions.scope === "ministere"
                      ? "Ministère"
                      : "Tous les produits"
                  }
                </div>
              )}
            </div>
          </div>
          {userPermissions?.canCreate && (
            <a href="/new-product" className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Nouveau Produit</span>
              <span className="sm:hidden">Nouveau</span>
            </a>
          )}
        </div>

        {/* Filtre par structure - Uniquement pour scope ministere ou all */}
        {(userPermissions?.scope === "ministere" || userPermissions?.scope === "all") && structures.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-sm">Filtrer par structure :</span>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`btn btn-sm ${selectedStructureFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedStructureFilter('ALL')}
                >
                  📋 Toutes ({products.length})
                </button>
                {structures.map((structure) => (
                  <button
                    key={structure.id}
                    className={`btn btn-sm ${selectedStructureFilter === structure.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedStructureFilter(structure.id)}
                    title={`${structure.ministereName} - ${structure.name}`}
                  >
                    🏢 {structure.ministereAbrev ? `${structure.ministereAbrev} - ` : ''}{structure.name}
                    {' '}({products.filter(p => p.structureId === structure.id).length})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {products.length === 0 ? (
        <div>
          <EmptyState
            message="Aucun produit disponible."
            iconComponent='PackageSearch'
          />
        </div>
      ) : (
        <>
          {/* Affichage desktop - tableau */}
          <div className='overflow-x-auto hidden md:block bg-base-100 shadow-xl rounded-lg border border-base-300'>
            <table className='table table-xs w-full'>
              <thead>
                <tr className="bg-primary text-primary-content">
                  <th className="text-sm font-semibold">#</th>
                  <th className="text-sm font-semibold">Image</th>
                  <th className="text-sm font-semibold">Nom</th>
                  <th className="text-sm font-semibold">Description</th>
                  <th className="text-sm font-semibold">Quantité</th>
                  <th className="text-sm font-semibold">Prix</th>
                  <th className="text-sm font-semibold">Catégorie</th>
                  {(userPermissions?.scope === "ministere" || userPermissions?.scope === "all") && (
                    <th className="text-sm font-semibold">Structure</th>
                  )}
                  <th className="text-sm font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredProducts().map((product, index) => (
                  <tr key={product.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">
                      {product.imageUrl ? (
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-12 h-12">
                            <span className="text-xs">
                              {product.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="font-bold text-[#793205] text-xs max-w-32 truncate" title={product.name}>
                        {product.name}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="text-xs text-gray-600 max-w-40 truncate" title={product.description}>
                        {product.description}
                      </div>
                    </td>
                    <td className="py-2">
                      {(() => {
                        const stockInfo = getStockStatus(
                          product.quantity || 0,
                          product.initialQuantity || product.quantity || 0
                        );
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <span className={`badge badge-sm font-semibold ${stockInfo.badgeClass}`}>
                                {product.quantity || 0}
                              </span>
                              <span className="text-xs text-gray-600">{product.unit}</span>
                            </div>
                            {stockInfo.status === 'out' && (
                              <div className="text-xs text-error font-medium mt-1">{stockInfo.label}</div>
                            )}
                            {stockInfo.status === 'low' && (
                              <div className="text-xs text-warning font-medium mt-1">
                                {stockInfo.label} ({stockInfo.percentage}%)
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="py-2">
                      <div className="font-bold text-[#793205] text-xs whitespace-nowrap">
                        {product.price ? product.price.toLocaleString() : 'N/A'} MRU
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="font-medium text-xs truncate max-w-28" title={product.categoryName}>
                        {product.categoryName}
                      </div>
                    </td>
                    {(userPermissions?.scope === "ministere" || userPermissions?.scope === "all") && (
                      <td className="py-2">
                        <div className="font-medium text-xs truncate max-w-28" title={product.structure?.name || 'N/A'}>
                          {product.structure?.name || 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="py-2">
                      <div className="flex gap-1 justify-center items-center">
                        {/* Seuls les Agents de saisie et Responsables Achats peuvent modifier */}
                        {(userPermissions?.canCreate) && (
                          <>
                            <Link
                              className='btn btn-xs btn-circle btn-warning hover:scale-110 transition-transform tooltip'
                              href={`/update-product/${product.id}`}
                              data-tip="Modifier"
                              aria-label="Modifier le produit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Link>
                            <button
                              className="btn btn-xs btn-circle btn-error hover:scale-110 transition-transform tooltip"
                              onClick={() => handleDeleteProduct(product)}
                              data-tip="Supprimer"
                              aria-label="Supprimer le produit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        )}
                        {/* Si l'utilisateur ne peut pas modifier, afficher un message */}
                        {!userPermissions?.canCreate && (
                          <span className="text-xs text-gray-500 italic px-2">Consultation seule</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Affichage mobile - cartes */}
          <div className='block md:hidden space-y-4'>
            {getFilteredProducts().map((product, index) => (
              <div key={product.id} className="card bg-base-100 shadow-lg border-2 border-[#F1D2BF] hover:border-[#793205] transition-all">
                <div className="card-body p-4">
                  <div className="flex items-start gap-4">
                    {/* Image du produit */}
                    <div className="shrink-0">
                      {product.imageUrl ? (
                        <div className="avatar">
                          <div className="mask mask-squircle w-16 h-16 ring-2 ring-[#F1D2BF]">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className="bg-[#793205] text-white rounded-xl w-16 h-16">
                            <span className="text-sm font-bold">
                              {product.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Informations du produit */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-[#793205] text-base leading-tight truncate pr-2" title={product.name}>
                          {product.name}
                        </h3>
                        <span className="badge badge-warning badge-sm whitespace-nowrap font-bold">
                          #{index + 1}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={product.description}>
                        {product.description}
                      </p>

                      {/* Prix et quantité */}
                      <div className="flex justify-between items-center mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Prix unitaire</div>
                          <div className="text-lg font-bold text-[#793205]">
                            {product.price ? product.price.toLocaleString() : 'N/A'} MRU
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600 mb-1">Stock</div>
                          {(() => {
                            const stockInfo = getStockStatus(
                              product.quantity || 0,
                              product.initialQuantity || product.quantity || 0
                            );
                            return (
                              <>
                                <span className={`badge badge-sm font-semibold ${stockInfo.badgeClass}`}>
                                  {product.quantity || 0} {product.unit}
                                </span>
                                {stockInfo.status === 'out' && (
                                  <div className="text-xs text-error font-medium mt-1">Épuisé</div>
                                )}
                                {stockInfo.status === 'low' && (
                                  <div className="text-xs text-warning font-medium mt-1">
                                    Faible ({stockInfo.percentage}%)
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Badges catégorie et structure */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="badge badge-info badge-outline badge-sm">
                          📂 {product.categoryName}
                        </div>
                        {(userPermissions?.scope === "ministere" || userPermissions?.scope === "all") && (
                          <div className="badge badge-success badge-outline badge-sm">
                            🏢 {product.structure?.name || 'N/A'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        {userPermissions?.canCreate ? (
                          <>
                            <Link
                              className='btn btn-warning btn-sm gap-1 hover:scale-105 transition-transform'
                              href={`/update-product/${product.id}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Modifier
                            </Link>
                            <button
                              className="btn btn-error btn-sm gap-1 hover:scale-105 transition-transform"
                              title="Supprimer le produit"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Supprimer
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 italic px-3 py-2 bg-gray-100 rounded">
                            Consultation seule
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Wrapper>
  )
}

export default ProductsPage
