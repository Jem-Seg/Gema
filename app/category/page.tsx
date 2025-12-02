"use client"
import React from 'react'
import { useSession } from 'next-auth/react'
import Wrapper from '../components/Wrapper'
import CategoryModal from '../components/CategoryModal'
import { createCategory, updateCategory, deleteCategory, getUserMinistereStructures, getAllCategoriesWithDetails, getUserPermissionsInfo } from '../actions'
import { toast } from 'react-toastify'
import { Category, Ministere, Structure } from '@prisma/client'
import EmptyState from '../components/EmptyState'

type MinistereWithStructures = Ministere & {
  structures: Structure[]
}

type CategoryWithDetails = Category & {
  ministere: Ministere
}

const CategoryPage = () => {
  const { data: session, status } = useSession()
  const user = session?.user

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null)
  const [categories, setCategories] = React.useState<CategoryWithDetails[]>([])
  const [ministeres, setMinisteres] = React.useState<MinistereWithStructures[]>([])
  const [userPermissions, setUserPermissions] = React.useState<{
    canCreate: boolean;
    canRead: boolean;
    scope: string;
    message: string;
  } | null>(null)

  // États pour la pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)

  // Charger les informations de permissions de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissionsInfo((user as any).id);
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
      }
    };
    loadPermissions();
  }, [status === 'authenticated', user]);

  // Charger les structures du ministère de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadUserMinistereStructures = async () => {
      try {
        const data = await getUserMinistereStructures((user as any).id);
        setMinisteres(data);
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
        toast.error('Erreur lors du chargement des structures de votre ministère');
      }
    };
    loadUserMinistereStructures();
  }, [status === 'authenticated', user]);

  // Charger toutes les catégories avec leurs détails
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadCategories = async () => {
      try {
        const data = await getAllCategoriesWithDetails((user as any).id);
        setCategories(data);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        setCategories([]);
        toast.error('Erreur lors du chargement des catégories');
      }
    };
    loadCategories();
  }, [status === 'authenticated', user]);

  // Filtrer les catégories par structure sélectionnée (maintenant par ministère)
  const getFilteredCategories = () => {
    return categories;
  };

  // Fonction pour paginer les catégories filtrées
  const getPaginatedCategories = () => {
    const filtered = getFilteredCategories();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(getFilteredCategories().length / itemsPerPage);

  // Réinitialiser la page à 1 quand les données changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);


  const openCreateCategoryModal = () => {
    setName('');
    setDescription('');
    setEditMode(false);
    (document.getElementById('category_modal') as HTMLDialogElement)?.showModal()
  }

  const closeModal = () => {
    setName('');
    setDescription('');
    setEditMode(false);
    setEditingCategoryId(null);
    (document.getElementById('category_modal') as HTMLDialogElement)?.close()
  }

  const openEditCategoryModal = (category: CategoryWithDetails) => {
    setName(category.name);
    setDescription(category.description || '');
    setEditMode(true);
    setEditingCategoryId(category.id);
    (document.getElementById('category_modal') as HTMLDialogElement)?.showModal()
  }

  const handleCreateCategory = async () => {
    if (!name.trim() || !(user as any)?.id) return;

    // Récupérer le ministereId de l'utilisateur
    const ministereId = (user as any)?.ministereId;
    if (!ministereId) {
      toast.error('Impossible de déterminer votre ministère');
      return;
    }

    setLoading(true);
    try {
      await createCategory(name, ministereId, (user as any).id, description);
      toast.success('Catégorie créée avec succès');
      // Recharger toutes les catégories
      const data = await getAllCategoriesWithDetails((user as any).id);
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie');
    }
    closeModal();
    setLoading(false);
  }

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !name.trim() || !(user as any)?.id) return;

    // Récupérer le ministereId de la catégorie en cours d'édition
    const categoryToEdit = categories.find(c => c.id === editingCategoryId);
    if (!categoryToEdit) {
      toast.error('Catégorie introuvable');
      return;
    }

    setLoading(true);
    try {
      await updateCategory(editingCategoryId, name, categoryToEdit.ministereId, (user as any).id, description);
      toast.success('Catégorie mise à jour avec succès');
      // Recharger toutes les catégories
      const data = await getAllCategoriesWithDetails((user as any).id);
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la catégorie');
    }
    closeModal();
    setLoading(false);
  }

  const handleDeleteCategory = async (categoryId: string, ministereId: string) => {
    if (!(user as any)?.id) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      await deleteCategory(categoryId, ministereId, (user as any).id);
      toast.success('Catégorie supprimée avec succès');
      // Recharger toutes les catégories
      const data = await getAllCategoriesWithDetails((user as any).id);
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression de la catégorie');
    }
  }

  // Afficher un loading si l'utilisateur n'est pas encore chargé
  if (status !== 'authenticated') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="alert alert-warning">
          <span>Vous devez être connecté pour accéder aux catégories.</span>
        </div>
      </div>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête avec titre et actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestion des Catégories</h1>
            <div className="flex items-center gap-2">
              <div className="badge badge-primary">
                {getFilteredCategories().length} catégorie{getFilteredCategories().length > 1 ? 's' : ''}
              </div>
              {userPermissions && (
                <div className={`badge ${userPermissions.canCreate ? 'badge-success' : 'badge-warning'}`}>
                  {userPermissions.canCreate ? 'Édition' : 'Lecture seule'}
                </div>
              )}
            </div>
          </div>

          {userPermissions?.canCreate && (
            <button
              className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
              onClick={openCreateCategoryModal}
              disabled={ministeres.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Ajouter une catégorie</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          )}
        </div>

        {/* Message d'information sur les permissions */}
        {userPermissions && (
          <div className={`alert ${userPermissions.canCreate ? 'alert-info' : 'alert-warning'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{userPermissions.message}</span>
          </div>
        )}

        {/* Avertissement si aucune structure disponible */}
        {ministeres.length === 0 && userPermissions?.canCreate && (
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">Aucune structure disponible pour votre rôle. Contactez un administrateur.</span>
          </div>
        )}

        {/* Table desktop / Cards mobile */}
        {categories.length > 0 ? (
          <>
            {/* Version desktop - Table */}
            <div className="hidden lg:block overflow-x-auto bg-base-100 shadow-xl rounded-lg border border-base-300">
              <table className="table w-full">
                <thead>
                  <tr className="bg-primary text-primary-content">
                    <th className="text-sm font-semibold">Nom</th>
                    <th className="text-sm font-semibold">Description</th>
                    <th className="text-sm font-semibold">Ministère</th>
                    <th className="text-sm font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedCategories().map((category) => (
                    <tr key={category.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                      <td className="font-bold text-primary">{category.name}</td>
                      <td className="text-base-content/80 max-w-xs">
                        <div className="line-clamp-2" title={category.description || ''}>
                          {category.description || <span className="italic text-base-content/50">Aucune description</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="badge badge-info badge-sm">{category.ministere.abreviation}</div>
                          <span className="text-sm truncate max-w-[150px]" title={category.ministere.name}>
                            {category.ministere.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex gap-2 justify-center">
                          {userPermissions?.canCreate ? (
                            <>
                              <button
                                className="btn btn-sm btn-warning btn-circle tooltip"
                                onClick={() => openEditCategoryModal(category)}
                                data-tip="Modifier"
                                aria-label="Modifier la catégorie"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                className="btn btn-sm btn-error btn-circle tooltip"
                                onClick={() => handleDeleteCategory(category.id, category.ministereId)}
                                data-tip="Supprimer"
                                aria-label="Supprimer la catégorie"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-base-content/50 italic">Lecture seule</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version mobile/tablette - Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getPaginatedCategories().map((category) => (
                <div key={category.id} className="card bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="card-title text-base text-primary flex-1">{category.name}</h3>
                      {userPermissions?.canCreate && (
                        <div className="flex gap-1">
                          <button
                            className="btn btn-xs btn-warning btn-circle"
                            onClick={() => openEditCategoryModal(category)}
                            aria-label="Modifier"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-xs btn-error btn-circle"
                            onClick={() => handleDeleteCategory(category.id, category.ministereId)}
                            aria-label="Supprimer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                      {category.description || <span className="italic">Aucune description</span>}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-base-content/60">Ministère:</span>
                        <div className="badge badge-info badge-sm">{category.ministere.abreviation}</div>
                      </div>
                    </div>

                    {!userPermissions?.canCreate && (
                      <div className="mt-3 pt-3 border-t border-base-300">
                        <span className="text-xs text-base-content/50 italic">Mode lecture seule</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {getFilteredCategories().length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-base-300 pt-4">
                <div className="text-sm text-base-content/70">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à{' '}
                  {Math.min(currentPage * itemsPerPage, getFilteredCategories().length)} sur{' '}
                  {getFilteredCategories().length} catégories
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="select select-bordered select-sm"
                    value={itemsPerPage}
                    title="Éléments par page"
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                  <div className="join">
                    <button className="join-item btn btn-sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                    <button className="join-item btn btn-sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                    <button className="join-item btn btn-sm btn-active">Page {currentPage} / {totalPages}</button>
                    <button className="join-item btn btn-sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                    <button className="join-item btn btn-sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            message={
              ministeres.length === 0
                ? "Aucun ministère disponible. Créez d'abord des ministères et structures."
                : "Aucune catégorie trouvée. Cliquez sur Ajouter une catégorie pour en créer une."
            }
            iconComponent="Group"
          />
        )}
      </div>

      <CategoryModal
        name={name}
        description={description}
        ministeres={ministeres}
        loading={loading}
        onclose={closeModal}
        onChangeName={setName}
        onChangeDescription={setDescription}
        onSubmit={editMode ? handleUpdateCategory : handleCreateCategory}
        editMode={editMode}
      />
    </Wrapper>
  )
}

export default CategoryPage
