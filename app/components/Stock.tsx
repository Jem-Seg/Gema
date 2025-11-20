"use client"
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getUserMinistereStructures, getUserPermissionsInfo, getAllProductsWithDetails, readProduct, replenishStockWithTransaction } from '../actions'
import { toast } from 'react-toastify'
import { Ministere, Structure } from '@prisma/client'
import { Produit } from '@/type'
import { getStockStatus } from '@/lib/stock-utils'


type MinistereWithStructures = Ministere & {
  structures: Structure[]
}

type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
  message: string;
}

const Stock = () => {
  const { data: session, status } = useSession()
  const user = session?.user

  // États pour les données utilisateur
  const [ministeres, setMinisteres] = React.useState<MinistereWithStructures[]>([])
  const [userPermissions, setUserPermissions] = React.useState<UserPermissions | null>(null)
  const [loading, setLoading] = React.useState(false)

  // États pour le formulaire de stock
  const [selectedStructureId, setSelectedStructureId] = React.useState('')
  const [products, setProducts] = useState<Produit[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(0)
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null)


  // Charger les informations de permissions de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissionsInfo((user as any).id);
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
        toast.error('Erreur lors du chargement des permissions');
      }
    };
    loadPermissions();
  }, [status, user]);

  // Charger les structures du ministère de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadUserMinistereStructures = async () => {
      try {
        setLoading(true);
        const data = await getUserMinistereStructures((user as any).id);
        setMinisteres(data);

        // Auto-sélectionner la première structure si l'utilisateur n'en a qu'une
        if (data.length === 1 && data[0].structures.length === 1) {
          setSelectedStructureId(data[0].structures[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
        toast.error('Erreur lors du chargement des structures de votre ministère');
      } finally {
        setLoading(false);
      }
    };
    loadUserMinistereStructures();
  }, [status, user]);

  // Charger les produits de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id || !userPermissions) return;

    const loadUserProducts = async () => {
      try {
        setLoading(true);
        let productsData: Produit[] = [];

        // Charger les produits selon les permissions de l'utilisateur
        if (userPermissions.scope === "ministere" || userPermissions.scope === "all") {
          // Si l'utilisateur a accès au scope "ministere" ou "all", utiliser la fonction globale
          productsData = await getAllProductsWithDetails((user as any)?.id);
        } else if (userPermissions.scope === "structure" && selectedStructureId) {
          // Si l'utilisateur a accès seulement à sa structure et qu'une structure est sélectionnée
          productsData = await readProduct(selectedStructureId);
        }

        setProducts(productsData);

        // Réinitialiser la sélection de produit
        setSelectedProductId("");
        setSelectedProduct(null);

      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        toast.error('Erreur lors du chargement des produits');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserProducts();
  }, [status, user, userPermissions, selectedStructureId]);

  // Gérer la sélection d'un produit
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);

    // Pré-remplir la quantité avec le stock actuel du produit
    if (product) {
      setQuantity(product.quantity || 0);
    }
  };

    // Soumettre la mise à jour du stock (peut être appelé depuis un onClick ou un onSubmit)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (!selectedProductId || quantity <= 0) {
      toast.error("Veuillez sélectionner un produit et entrer une quantité valide.");
      return;
    }

    try {
      // Trouver la vraie structure du produit sélectionné
      const selectedProductData = products.find(p => p.id === selectedProductId);
      if (!selectedProductData) {
        toast.error("Produit sélectionné introuvable.");
        return;
      }

      // Utiliser la structure du produit au lieu de celle sélectionnée dans le dropdown
      const actualStructureId = selectedProductData.structureId;
      
      if (selectedProductId && actualStructureId) {
        // Effectuer la mise à jour du stock via l'API avec la vraie structure
        await replenishStockWithTransaction(selectedProductId, quantity, actualStructureId);
        toast.success('Stock mis à jour avec succès !');

        // Émettre un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('stockUpdated', {
          detail: {
            productId: selectedProductId,
            newQuantity: quantity,
            structureId: actualStructureId
          }
        }));

        // Recharger les produits après la mise à jour
        try {
          let productsData: Produit[] = [];
          if (userPermissions?.scope === "ministere" || userPermissions?.scope === "all") {
            productsData = await getAllProductsWithDetails(user?.id);
          } else if (userPermissions?.scope === "structure" && selectedStructureId) {
            productsData = await readProduct(selectedStructureId);
          }
          setProducts(productsData);
        } catch (error) {
          console.error('Erreur lors du rechargement des produits:', error);
        }

        setSelectedProductId('');
        setSelectedProduct(null);
        setQuantity(0);
        (document.getElementById('my_modal_stock') as HTMLDialogElement)?.close();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setSelectedStructureId('');
    setSelectedProductId('');
    setSelectedProduct(null);
    setQuantity(0);
    (document.getElementById('my_modal_stock') as HTMLDialogElement)?.close()
  }

  // Afficher un loading si l'utilisateur n'est pas encore chargé
  if (status === 'loading') {
    return (
      <dialog id="my_modal_stock" className="modal">
        <div className="modal-box">
          <div className="flex justify-center items-center p-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </dialog>
    );
  }
  // Afficher un message si l'utilisateur n'est pas connecté
  // Afficher un message si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <dialog id="my_modal_stock" className="modal">
        <div className="modal-box">
          <div className="alert alert-warning">
            <span>Vous devez être connecté pour accéder à la gestion du stock.</span>
          </div>
        </div>
      </dialog>
    );
  }

  return (
    <div>
      <dialog id="my_modal_stock" className="modal">
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            {/* Bouton de fermeture */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>✕</button>
          </form>

          {/* Titre */}
          <h3 className="font-bold text-lg mb-6">📦 Gestion du Stock</h3>

          {/* Affichage des permissions utilisateur */}
          {userPermissions && (
            <div className={`alert mb-4 ${userPermissions.canCreate ? 'alert-info' : 'alert-warning'}`}>
              <div className="flex items-start gap-2">
                <div className="text-lg">
                  {userPermissions.canCreate ? '✅' : '⚠️'}
                </div>
                <div>
                  <div className="font-semibold">
                    {userPermissions.canCreate ? 'Accès autorisé' : 'Accès limité'}
                  </div>
                  <span className="text-sm">{userPermissions.message}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contenu principal */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="loading loading-spinner loading-lg"></div>
              <span className="ml-2">Chargement des données...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sélection de la structure */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Structure</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedStructureId}
                  onChange={(e) => setSelectedStructureId(e.target.value)}
                  disabled={!userPermissions?.canCreate}
                >
                  <option value="">Sélectionner une structure...</option>
                  {ministeres.map((ministere) => (
                    <optgroup key={ministere.id} label={ministere.name}>
                      {ministere.structures.map((structure) => (
                        <option key={structure.id} value={structure.id}>
                          {structure.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {ministeres.length === 0 && (
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      Aucune structure disponible pour votre rôle
                    </span>
                  </label>
                )}
              </div>

              {/* Sélection du produit */}
              {products.length > 0 && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Produit</span>
                    <span className="label-text-alt badge badge-neutral badge-sm">
                      {products.length} produits disponibles
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    disabled={!userPermissions?.canRead}
                  >
                    <option value="">Sélectionner un produit...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - Stock: {product.quantity || 0} {product.unit} 
                        {product.structure?.name && ` (${product.structure.name})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Détails du produit sélectionné */}
              {selectedProduct && (
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      📦 Détails du produit sélectionné
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-sm">Nom :</span>
                          <p className="text-base font-semibold">{selectedProduct.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Description :</span>
                          <p className="text-sm text-base-content/70">{selectedProduct.description || 'Aucune description'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Catégorie :</span>
                          <span className="badge badge-primary badge-sm ml-2">
                            {selectedProduct.categoryName || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Structure :</span>
                          <span className="badge badge-secondary badge-sm ml-2">
                            {selectedProduct.structure?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-sm">Stock actuel :</span>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const stockInfo = getStockStatus(
                                selectedProduct.quantity || 0,
                                selectedProduct.initialQuantity || selectedProduct.quantity || 0
                              );
                              return (
                                <>
                                  <span className={`badge font-semibold ${stockInfo.badgeClass}`}>
                                    {selectedProduct.quantity || 0} {selectedProduct.unit}
                                  </span>
                                  {stockInfo.status === 'out' && (
                                    <span className="text-xs text-error">{stockInfo.label}</span>
                                  )}
                                  {stockInfo.status === 'low' && (
                                    <span className="text-xs text-warning">
                                      {stockInfo.label} ({stockInfo.percentage}% restant)
                                    </span>
                                  )}
                                  {stockInfo.status === 'normal' && stockInfo.percentage < 100 && (
                                    <span className="text-xs text-base-content/60">
                                      {stockInfo.percentage}% du stock initial
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Prix unitaire :</span>
                          <p className="text-lg font-bold text-primary">
                            {selectedProduct.price?.toLocaleString()} MRU
                          </p>
                        </div>
                        {userPermissions?.scope !== 'structure' && selectedProduct.structure && (
                          <div>
                            <span className="font-medium text-sm">Structure :</span>
                            <span className="badge badge-accent badge-sm ml-2">
                              {selectedProduct.structure.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations sur l'utilisateur */}
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h4 className="font-semibold mb-2">Informations utilisateur</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Portée d&apos;accès :</span>
                      <span className={`ml-2 badge badge-sm ${userPermissions?.scope === 'all' ? 'badge-success' :
                        userPermissions?.scope === 'ministere' ? 'badge-info' :
                          'badge-accent'
                        }`}>
                        {userPermissions?.scope === 'all' ? 'Tous les ministères' :
                          userPermissions?.scope === 'ministere' ? 'Ministère' :
                            'Structure'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Produits disponibles :</span>
                      <span className="ml-2 badge badge-neutral badge-sm">
                        {products.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerte informative sur la structure du produit */}
              {selectedProduct && selectedStructureId && selectedProduct.structureId !== selectedStructureId && (
                <div className="alert alert-info">
                  <div className="flex items-start gap-2">
                    <div className="text-lg">ℹ️</div>
                    <div>
                      <div className="font-semibold">Information importante</div>
                      <span className="text-sm">
                        Ce produit appartient à &ldquo;{selectedProduct.structure?.name}&rdquo;. 
                        Le stock sera automatiquement ajouté à cette structure d&apos;origine.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gestion de la quantité (si un produit est sélectionné et que l'utilisateur peut modifier) */}
              {selectedProduct && userPermissions?.canCreate && (
                <div className="card bg-accent/10 border border-accent/20">
                  <div className="card-body p-4">
                    <h4 className="font-semibold mb-3 text-accent">⚡ Réapprovisionnement du stock</h4>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Quantité à ajouter</span>
                        <span className="label-text-alt text-xs">
                          Stock actuel: {selectedProduct.quantity || 0} {selectedProduct.unit} → Sera ajouté au stock existant
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Quantité à ajouter (ex: 50)"
                          className="input input-bordered flex-1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        />
                        <span className="btn btn-ghost btn-disabled">
                          {selectedProduct.unit}
                        </span>
                      </div>
                      {quantity > 0 && (
                        <label className="label">
                          <span className="label-text-alt text-xs text-success">
                            Nouveau stock après ajout: {(selectedProduct.quantity || 0) + quantity} {selectedProduct.unit}
                          </span>
                        </label>
                      )}
                      {quantity === 0 && (
                        <label className="label">
                          <span className="label-text-alt text-xs text-base-content/50">
                            Entrez une quantité à ajouter au stock actuel
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  className="btn btn-ghost"
                  onClick={closeModal}
                >
                  Fermer
                </button>
                {products.length === 0 && selectedStructureId && userPermissions?.canRead && (
                  <div className="text-sm text-base-content/50 px-3 py-2">
                    Aucun produit dans cette structure
                  </div>
                )}
                {selectedProduct && userPermissions?.canCreate && quantity > 0 && (
                  <button
                    className="btn btn-accent"
                    onClick={handleSubmit}
                  >
                    Ajouter au stock
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </dialog>
    </div>
  )
}

export default Stock
