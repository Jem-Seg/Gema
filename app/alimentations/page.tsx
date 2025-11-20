'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Wrapper from '../components/Wrapper';
import AlimentationModal from '../components/AlimentationModal';
import { toast } from 'react-toastify';


interface Alimentation {
  id: string;
  numero: string;
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  fournisseurNom: string;
  fournisseurNIF: string | null;
  statut: string;
  observations?: string;
  createdAt: string;
  isLocked: boolean;
  produit: {
    id: string;
    name: string;
    unit: string;
  };
  structure: {
    name: string;
    ministere: {
      name: string;
    };
  };
  documents?: Array<{
    id: string;
    type: string;
    nom: string;
    url: string;
    taille: number;
    mimeType: string;
    createdAt: string;
  }>;
  historiqueActions: Array<{
    id: string;
    action: string;
    ancienStatut: string;
    nouveauStatut: string;
    userRole: string;
    observations?: string;
    createdAt: string;
  }>;
}

const AlimentationsPage = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [alimentations, setAlimentations] = useState<Alimentation[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [roleLoading, setRoleLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAlimentation, setSelectedAlimentation] = useState<Alimentation | null>(null);
  const [actionType, setActionType] = useState<'instance' | 'validate' | 'reject' | 'delete' | 'maintenir-instance'>('validate');
  const [observations, setObservations] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [alimentationToEdit, setAlimentationToEdit] = useState<Alimentation | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAlimentationHistory, setSelectedAlimentationHistory] = useState<Alimentation | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedAlimentationDocuments, setSelectedAlimentationDocuments] = useState<Alimentation | null>(null);

  // États pour la sélection multiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewedObservationsIds, setViewedObservationsIds] = useState<Set<string>>(new Set());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  // État pour le filtrage par statut
  const [statusFilter, setStatusFilter] = useState<string>('TOUS');



  // Charger les alimentations
  const loadAlimentations = useCallback(async () => {
    try {
      const response = await fetch('/api/alimentations');
      const result = await response.json();

      if (result.success) {
        setAlimentations(result.data || []);
      } else {
        toast.error(result.message || 'Erreur lors du chargement des alimentations');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des alimentations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger le rôle de l'utilisateur
  const loadUserRole = useCallback(async () => {
    if (!(user as any)?.id) return;
    
    try {
      setRoleLoading(true);
      const response = await fetch(`/api/user/${(user as any).id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du rôle');
      }
      
      const result = await response.json();

      // L'API retourne { user: {...} }
      const userData = result.user;
      const roleName = userData?.role?.name;
      const isUserAdmin = userData?.isAdmin || false;

      console.log('🔍 Chargement du rôle:', roleName);
      console.log('🔍 Est admin:', isUserAdmin);
      console.log('🔍 Résultat complet:', result);

      if (roleName) {
        setUserRole(roleName);
      }
      
      // Pour les admins sans rôle spécifique, utiliser "Admin"
      if (isUserAdmin && !roleName) {
        setUserRole('Admin');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rôle:', error);
    } finally {
      setRoleLoading(false);
    }
  }, [(user as any)?.id]);



  useEffect(() => {
    if (status === 'authenticated' && (user as any)?.id) {
      loadAlimentations();
      loadUserRole();
    }
  }, [status, (user as any)?.id, loadAlimentations, loadUserRole]);



  // Effectuer une action sur une alimentation
  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAlimentation) return;

    try {
      let response;

      if (actionType === 'delete') {
        // Suppression
        response = await fetch(`/api/alimentations/${selectedAlimentation.id}`, {
          method: 'DELETE',
        });
      } else if (actionType === 'maintenir-instance') {
        // Maintenir en instance
        response = await fetch(`/api/alimentations/${selectedAlimentation.id}/maintenir-instance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ observations }),
        });
      } else {
        // Instance, Validate, Reject
        response = await fetch(`/api/alimentations/${selectedAlimentation.id}/${actionType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ observations }),
        });
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Action effectuée avec succès');
        setShowActionModal(false);
        setObservations('');
        setSelectedAlimentation(null);
        loadAlimentations();

        // Déclencher l'événement de mise à jour du stock pour rafraîchir les autres pages
        window.dispatchEvent(new CustomEvent('stockUpdated'));
      } else {
        toast.error(result.message || 'Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'action');
    }
  };

  // Ouvrir le modal de modification
  const openEditModal = (alimentation: Alimentation) => {
    setAlimentationToEdit(alimentation);
    setShowEditModal(true);
    // Ouvrir le modal après un court délai pour s'assurer que le state est mis à jour
    setTimeout(() => {
      (document.getElementById('modal_modifier_alimentation') as HTMLDialogElement)?.showModal();
    }, 100);
  };

  // Ouvrir le modal d'action
  const openActionModal = (alimentation: Alimentation, action: 'instance' | 'validate' | 'reject' | 'delete' | 'maintenir-instance') => {
    // Le Responsable Achats ne peut pas accéder aux actions de workflow
    const isResponsableAchats = userRole === 'Responsable Achats' || userRole === 'Responsable achats';
    if (isResponsableAchats && action !== 'delete') {
      toast.error('Cette action n\'est pas autorisée pour votre rôle');
      return;
    }
    
    setSelectedAlimentation(alimentation);
    setActionType(action);
    setShowActionModal(true);
  };

  // Ouvrir le modal d'historique et marquer comme consulté
  const openHistoryModal = (alimentation: Alimentation) => {
    setSelectedAlimentationHistory(alimentation);
    setShowHistoryModal(true);
    markObservationsViewed(alimentation.id);
  };

  // Ouvrir le modal des documents
  const openDocumentsModal = (alimentation: Alimentation) => {
    setSelectedAlimentationDocuments(alimentation);
    setShowDocumentsModal(true);
  };

  // Déterminer si l'utilisateur peut modifier/supprimer (Responsable achats uniquement)
  const canEditOrDelete = (alimentation: Alimentation) => {
    // Les admins peuvent toujours modifier/supprimer (sauf si verrouillé)
    if (userRole === 'Admin' && !alimentation.isLocked) {
      return true;
    }
    
    const isResponsableAchats = userRole === 'Responsable Achats' ||
      userRole === 'Responsable achats';
    // Peut modifier/supprimer si statut SAISIE ou INSTANCE_FINANCIER (pas encore validé) et non verrouillé
    // Peut aussi supprimer (mais pas modifier) si statut REJETE
    const editableStatuses = ['SAISIE', 'INSTANCE_FINANCIER', 'REJETE'];
    return isResponsableAchats && editableStatuses.includes(alimentation.statut) && !alimentation.isLocked;
  };

  // Déterminer si on peut modifier (et pas seulement supprimer)
  const canEdit = (alimentation: Alimentation) => {
    // Admin peut toujours modifier (y compris REJETE pour remettre en INSTANCE_FINANCIER)
    if (userRole === 'Admin' && !alimentation.isLocked) {
      return true;
    }
    
    const isResponsableAchats = userRole === 'Responsable Achats' ||
      userRole === 'Responsable achats';
    // Responsable achats peut modifier uniquement SAISIE et INSTANCE_FINANCIER (pas REJETE)
    const editableStatuses = ['SAISIE', 'INSTANCE_FINANCIER'];
    return isResponsableAchats && editableStatuses.includes(alimentation.statut) && !alimentation.isLocked;
  };

  // Déterminer les actions disponibles selon le rôle et le statut
  const getAvailableActions = (alimentation: Alimentation) => {
    if (alimentation.isLocked) return [];
    if (!userRole) return []; // Attendre que le rôle soit chargé

    const actions: Array<'instance' | 'validate' | 'reject' | 'maintenir-instance'> = [];

    // Debug
    console.log('getAvailableActions - userRole:', userRole, 'statut:', alimentation.statut);

    // Les administrateurs ont tous les droits
    if (userRole === 'Admin') {
      console.log('✅ Utilisateur admin - tous les droits accordés');
      // Actions disponibles selon le statut
      switch (alimentation.statut) {
        case 'SAISIE':
        case 'INSTANCE_FINANCIER':
          return ['maintenir-instance', 'validate'];
        case 'VALIDE_FINANCIER':
        case 'INSTANCE_DIRECTEUR':
          return ['instance', 'validate'];
        case 'VALIDE_DIRECTEUR':
        case 'INSTANCE_ORDONNATEUR':
          return ['instance', 'validate', 'reject'];
        default:
          return [];
      }
    }

    // Directeur Financier / Responsable financier
    if (userRole === 'Directeur Financier' ||
      userRole === 'Directeur financier' ||
      userRole === 'Responsable financier' ||
      userRole === 'Responsable Financier') {
      // Pour les alimentations en INSTANCE_FINANCIER (nouvellement créées)
      if (alimentation.statut === 'INSTANCE_FINANCIER') {
        console.log('✅ Ajout des actions pour Responsable financier');
        actions.push('maintenir-instance', 'validate');
      }
    }

    // Directeur
    if (userRole === 'Directeur') {
      console.log('🔍 Directeur - statut alimentation:', alimentation.statut);
      if (alimentation.statut === 'VALIDE_FINANCIER') {
        console.log('✅ Ajout actions instance et validate pour Directeur (VALIDE_FINANCIER)');
        actions.push('instance', 'validate');
      } else if (alimentation.statut === 'INSTANCE_DIRECTEUR') {
        console.log('✅ Ajout action validate pour Directeur (INSTANCE_DIRECTEUR)');
        actions.push('validate');
      }
    }

    // Ordonnateur
    if (userRole === 'Ordonnateur') {
      if (alimentation.statut === 'VALIDE_DIRECTEUR') {
        actions.push('instance', 'validate', 'reject');
      } else if (alimentation.statut === 'INSTANCE_ORDONNATEUR') {
        actions.push('validate', 'reject');
      }
    }

    return actions;
  };

  // Déterminer les statuts pertinents pour chaque rôle
  const getRelevantStatuses = () => {
    const normalizedRole = userRole.toLowerCase().trim();
    
    if (userRole === 'Admin') {
      // Admin peut voir tous les statuts (SAISIE = INSTANCE_FINANCIER, VALIDE_FINANCIER = INSTANCE_DIRECTEUR, VALIDE_DIRECTEUR = INSTANCE_ORDONNATEUR)
      return ['TOUS', 'INSTANCE_FINANCIER', 'VALIDE_FINANCIER', 'VALIDE_DIRECTEUR', 'VALIDE_ORDONNATEUR', 'REJETE'];
    }
    else if (normalizedRole.includes('financier')) {
      // Directeur financier voit : INSTANCE_FINANCIER (à traiter) et VALIDE_FINANCIER (traités)
      return ['TOUS', 'INSTANCE_FINANCIER', 'VALIDE_FINANCIER'];
    }
    else if (normalizedRole === 'directeur') {
      // Directeur voit : VALIDE_FINANCIER (= Instance Directeur, à traiter) et VALIDE_DIRECTEUR (traités)
      return ['TOUS', 'VALIDE_FINANCIER', 'VALIDE_DIRECTEUR'];
    }
    else if (normalizedRole === 'ordonnateur') {
      // Ordonnateur voit : VALIDE_DIRECTEUR (= Instance Ordonnateur, à traiter) et VALIDE_ORDONNATEUR (traités)
      return ['TOUS', 'VALIDE_DIRECTEUR', 'VALIDE_ORDONNATEUR'];
    }
    else if (normalizedRole === 'agent de saisie' || normalizedRole.includes('responsable')) {
      // Agent et Responsable voient : leurs saisies
      return ['TOUS', 'INSTANCE_FINANCIER', 'REJETE'];
    }
    
    return ['TOUS'];
  };

  // Filtrer les alimentations selon le statut
  const getFilteredAlimentations = () => {
    let filtered = alimentations;
    
    // Si un statut spécifique est sélectionné (pas TOUS), filtrer par ce statut
    if (statusFilter !== 'TOUS') {
      filtered = filtered.filter(a => a.statut === statusFilter);
      return filtered;
    }
    
    // Si statusFilter === 'TOUS', afficher toutes les alimentations
    return filtered;
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case 'SAISIE': return 'badge-warning';
      case 'INSTANCE_FINANCIER': return 'badge-info';
      case 'VALIDE_FINANCIER': return 'badge-success';
      case 'INSTANCE_DIRECTEUR': return 'badge-info';
      case 'VALIDE_DIRECTEUR': return 'badge-success';
      case 'INSTANCE_ORDONNATEUR': return 'badge-info';
      case 'VALIDE_ORDONNATEUR': return 'badge-success';
      case 'REJETE': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      'SAISIE': '📝 En saisie',
      'INSTANCE_FINANCIER': '⏳ Instance Financier',
      'VALIDE_FINANCIER': '✅ Validé Financier',
      'INSTANCE_DIRECTEUR': '⏳ Instance Directeur',
      'VALIDE_DIRECTEUR': '✅ Validé Directeur',
      'INSTANCE_ORDONNATEUR': '⏳ Instance Ordonnateur',
      'VALIDE_ORDONNATEUR': '🎉 Validé Final',
      'REJETE': '❌ Rejeté'
    };
    return labels[statut] || statut;
  };

  // Gestion de la sélection multiple
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const filteredAlimentations = getFilteredAlimentations();
    if (selectedIds.size === filteredAlimentations.length && filteredAlimentations.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAlimentations.map(a => a.id)));
    }
  };

  // Marquer une alimentation comme ayant ses observations consultées
  const markObservationsViewed = (id: string) => {
    setViewedObservationsIds(prev => new Set(prev).add(id));
  };

  // Exécuter une action groupée
  const executeBulkAction = async (action: 'instance' | 'validate' | 'reject') => {
    if (selectedIds.size === 0) {
      toast.warning('Aucune alimentation sélectionnée');
      return;
    }

    // Vérifier que toutes les alimentations sélectionnées ont leurs observations consultées
    const notViewed = Array.from(selectedIds).filter(id => !viewedObservationsIds.has(id));
    if (notViewed.length > 0) {
      toast.error('Vous devez d\'abord consulter les observations de toutes les alimentations sélectionnées');
      return;
    }

    // Demander confirmation
    const confirmMessage = `Êtes-vous sûr de vouloir ${action === 'validate' ? 'valider' : action === 'reject' ? 'rejeter' : 'mettre en instance'
      } ${selectedIds.size} alimentation(s) ?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkActionInProgress(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const endpoint = action === 'reject'
          ? `/api/alimentations/${id}/reject`
          : action === 'instance'
            ? `/api/alimentations/${id}/instance`
            : `/api/alimentations/${id}/validate`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ observations: observations || undefined })
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Erreur pour ${id}:`, result.message || 'Erreur inconnue');
        }
      } catch (error) {
        errorCount++;
        console.error(`Erreur pour ${id}:`, error);
      }
    }

    setBulkActionInProgress(false);

    if (successCount > 0) {
      toast.success(`${successCount} alimentation(s) traitée(s) avec succès`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erreur(s) rencontrée(s)`);
    }

    // Réinitialiser et recharger
    setSelectedIds(new Set());
    setViewedObservationsIds(new Set());
    setObservations('');
    loadAlimentations();
  };

  if (status !== 'authenticated') {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Wrapper>
    );
  }

  if (!user) {
    return (
      <Wrapper>
        <div className="text-center py-8">
          <p>Veuillez vous connecter pour accéder aux alimentations.</p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#793205]">Gestion des Alimentations</h1>
          <div className="flex gap-2 items-center">
            {userRole && (
              <span className="badge badge-outline">{userRole}</span>
            )}
            {(userRole === 'Responsable Achats' || userRole === 'Responsable achats') && (
              <button
                className="btn btn-primary"
                onClick={() => (document.getElementById('modal_nouvelle_alimentation') as HTMLDialogElement)?.showModal()}
              >
                Nouvelle Alimentation
              </button>
            )}
          </div>
        </div>

        {/* Filtre par statut */}
        {!loading && !roleLoading && userRole && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-sm">Filtrer par statut :</span>
              <div className="flex flex-wrap gap-2">
                {getRelevantStatuses().map((status) => (
                  <button
                    key={status}
                    className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'TOUS' && `📋 Tous (${alimentations.length})`}
                    {status === 'INSTANCE_FINANCIER' && `⏳ Instance Financier (${alimentations.filter(a => a.statut === 'INSTANCE_FINANCIER').length})`}
                    {status === 'VALIDE_FINANCIER' && `⏳ Instance Directeur (${alimentations.filter(a => a.statut === 'VALIDE_FINANCIER').length})`}
                    {status === 'VALIDE_DIRECTEUR' && `⏳ Instance Ordonnateur (${alimentations.filter(a => a.statut === 'VALIDE_DIRECTEUR').length})`}
                    {status === 'VALIDE_ORDONNATEUR' && `✅ Validé Final (${alimentations.filter(a => a.statut === 'VALIDE_ORDONNATEUR').length})`}
                    {status === 'REJETE' && `❌ Rejeté (${alimentations.filter(a => a.statut === 'REJETE').length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              📌 {statusFilter === 'TOUS' ? `Affichage de toutes les alimentations (${getFilteredAlimentations().length})` : `Affichage des alimentations avec le statut : ${statusFilter} (${getFilteredAlimentations().length})`}
            </div>
          </div>
        )}

        {loading || roleLoading || !userRole ? (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-[#F1D2BF]"></span>
              <p className="mt-4 text-gray-600">
                {!userRole && !roleLoading ? 'Chargement du rôle utilisateur...' : 'Chargement...'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Barre d'actions groupées - Non visible pour Responsable Achats */}
            {selectedIds.size > 0 && userRole !== 'Responsable Achats' && userRole !== 'Responsable achats' && (
              <div className="mb-4 p-4 bg-base-200 rounded-lg flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{selectedIds.size} alimentation(s) sélectionnée(s)</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setSelectedIds(new Set());
                      setViewedObservationsIds(new Set());
                    }}
                  >
                    Tout désélectionner
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <textarea
                    placeholder="Observations (optionnel)"
                    className="textarea textarea-bordered textarea-sm w-64"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => executeBulkAction('instance')}
                    disabled={bulkActionInProgress}
                  >
                    {bulkActionInProgress ? <span className="loading loading-spinner loading-xs"></span> : '⏳ Mettre en instance'}
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => executeBulkAction('validate')}
                    disabled={bulkActionInProgress}
                  >
                    {bulkActionInProgress ? <span className="loading loading-spinner loading-xs"></span> : '✅ Valider'}
                  </button>
                  {/* Bouton Rejeter - Uniquement pour l'Ordonnateur et Admin */}
                  {(userRole === 'Ordonnateur' || userRole === 'Admin') && (
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => executeBulkAction('reject')}
                      disabled={bulkActionInProgress}
                    >
                      {bulkActionInProgress ? <span className="loading loading-spinner loading-xs"></span> : '❌ Rejeter'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Vue Desktop - Tableau classique */}
            <div className="hidden lg:block overflow-x-auto bg-base-100 shadow-xl rounded-lg border border-base-300">
              <table className="table table-xs w-full">
                <thead>
                  <tr className="bg-primary text-primary-content">
                    {/* Checkbox de sélection globale - Masquée pour Responsable Achats */}
                    {userRole !== 'Responsable Achats' && userRole !== 'Responsable achats' && (
                      <th className="text-sm font-semibold">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={selectedIds.size === getFilteredAlimentations().length && getFilteredAlimentations().length > 0}
                          onChange={toggleSelectAll}
                          aria-label="Sélectionner tout"
                        />
                      </th>
                    )}
                    <th className="text-sm font-semibold">Numéro</th>
                    <th className="text-sm font-semibold">Produit</th>
                    <th className="text-sm font-semibold">Qté</th>
                    <th className="text-sm font-semibold">Prix U.</th>
                    <th className="text-sm font-semibold">Fournisseur</th>
                    <th className="text-sm font-semibold">Docs</th>
                    <th className="text-sm font-semibold">Statut</th>
                    <th className="text-sm font-semibold">Date</th>
                    <th className="text-sm font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAlimentations().map((alimentation) => (
                    <tr key={alimentation.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                      {/* Checkbox de sélection - Masquée pour Responsable Achats */}
                      {userRole !== 'Responsable Achats' && userRole !== 'Responsable achats' && (
                        <td className="py-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-xs"
                            checked={selectedIds.has(alimentation.id)}
                            onChange={() => toggleSelection(alimentation.id)}
                            aria-label={`Sélectionner ${alimentation.numero}`}
                          />
                        </td>
                      )}
                      <td className="py-2">
                        <div className="font-bold text-[#793205] text-xs">{alimentation.numero}</div>
                        <div className="text-[10px] text-gray-600 truncate max-w-[120px]" title={alimentation.structure.ministere.name}>
                          {alimentation.structure.ministere.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]" title={alimentation.structure.name}>
                          {alimentation.structure.name}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="font-medium text-[#793205] text-xs truncate max-w-[100px]" title={alimentation.produit.name}>
                          {alimentation.produit.name}
                        </div>
                      </td>
                      <td className="font-semibold text-xs py-2 whitespace-nowrap">{alimentation.quantite} {alimentation.produit.unit}</td>
                      <td className="font-bold text-[#793205] text-xs py-2 whitespace-nowrap">{alimentation.prixUnitaire.toLocaleString()} MRU</td>
                      <td className="py-2">
                        <div className="font-medium text-xs truncate max-w-[100px]" title={alimentation.fournisseurNom}>
                          {alimentation.fournisseurNom}
                        </div>
                        {alimentation.fournisseurNIF && (
                          <div className="text-[10px] text-gray-500 truncate max-w-[100px]">NIF: {alimentation.fournisseurNIF}</div>
                        )}
                      </td>
                      <td className="py-2">
                        {alimentation.documents && alimentation.documents.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {alimentation.documents.map((doc) => (
                              <a
                                key={doc.id}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-xs btn-ghost gap-1 px-1"
                                title={doc.nom}
                              >
                                {doc.type === 'FACTURE' && '📄'}
                                {doc.type === 'PV_RECEPTION' && '📋'}
                                {doc.type === 'AUTRE' && '📎'}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Aucun</span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${getStatusBadgeColor(alimentation.statut)} badge-sm font-semibold whitespace-nowrap px-2 py-2 text-[10px]`}>
                            {getStatusLabel(alimentation.statut)}
                          </span>
                          {alimentation.isLocked && (
                            <span className="badge badge-ghost badge-xs whitespace-nowrap text-[9px]">
                              🔒
                            </span>
                          )}
                          {alimentation.historiqueActions && alimentation.historiqueActions.length > 0 && (
                            <button
                              onClick={() => openHistoryModal(alimentation)}
                              className={`badge badge-xs whitespace-nowrap text-[9px] cursor-pointer ${viewedObservationsIds.has(alimentation.id) ? 'badge-success' : 'badge-info hover:badge-primary'
                                }`}
                              title={viewedObservationsIds.has(alimentation.id) ? "Observations consultées" : "Voir les observations"}
                            >
                              {viewedObservationsIds.has(alimentation.id) ? '✓ ' : '💬 '}{alimentation.historiqueActions.length}
                            </button>
                          )}
                          {alimentation.documents && alimentation.documents.length > 0 && (
                            <button
                              onClick={() => openDocumentsModal(alimentation)}
                              className="badge badge-primary badge-xs whitespace-nowrap text-[9px] cursor-pointer hover:badge-secondary"
                              title="Voir les documents"
                            >
                              📎 {alimentation.documents.length}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-xs py-2 whitespace-nowrap">{new Date(alimentation.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2">
                        <div className="flex gap-1 justify-center items-center flex-wrap">
                          {/* Actions pour Responsable achats et Admin */}
                          {canEdit(alimentation) && (
                            <button
                              className="btn btn-xs btn-circle btn-warning hover:scale-110 transition-transform tooltip"
                              onClick={() => openEditModal(alimentation)}
                              data-tip="Modifier"
                              aria-label="Modifier l'alimentation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          )}
                          {canEditOrDelete(alimentation) && (
                            <button
                              className="btn btn-xs btn-circle btn-error hover:scale-110 transition-transform tooltip"
                              onClick={() => openActionModal(alimentation, 'delete')}
                              data-tip="Supprimer"
                              aria-label="Supprimer l'alimentation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}

                          {/* Actions workflow selon le rôle */}
                          {getAvailableActions(alimentation).map((action) => {
                            console.log('🎨 Rendu du bouton action:', action, 'pour alimentation:', alimentation.numero);
                            if (action === 'maintenir-instance') {
                              return (
                                <button
                                  key="maintenir-instance"
                                  className="btn btn-xs btn-circle btn-warning hover:scale-110 transition-transform tooltip"
                                  onClick={() => openActionModal(alimentation, 'maintenir-instance')}
                                  data-tip="Maintenir en instance"
                                  aria-label="Maintenir en instance"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              );
                            } else if (action === 'instance') {
                              return (
                                <button
                                  key="instance"
                                  className="btn btn-xs btn-circle btn-info hover:scale-110 transition-transform tooltip"
                                  onClick={() => openActionModal(alimentation, 'instance')}
                                  data-tip="Mettre en instance"
                                  aria-label="Mettre en instance"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              );
                            } else if (action === 'validate') {
                              return (
                                <button
                                  key="validate"
                                  className="btn btn-xs btn-circle btn-success hover:scale-110 transition-transform tooltip"
                                  onClick={() => openActionModal(alimentation, 'validate')}
                                  data-tip="Valider"
                                  aria-label="Valider l'alimentation"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              );
                            } else if (action === 'reject') {
                              return (
                                <button
                                  key="reject"
                                  className="btn btn-xs btn-circle btn-error hover:scale-110 transition-transform tooltip"
                                  onClick={() => openActionModal(alimentation, 'reject')}
                                  data-tip="Rejeter"
                                  aria-label="Rejeter l'alimentation"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              );
                            }
                            return null;
                          })}

                          {/* Aucune action disponible */}
                          {!canEditOrDelete(alimentation) && getAvailableActions(alimentation).length === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue Mobile - Cartes */}
            <div className="lg:hidden space-y-4">
              {getFilteredAlimentations().map((alimentation) => (
                <div key={alimentation.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body p-4">
                    {/* En-tête */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-2">
                        {/* Checkbox mobile - Masquée pour Responsable Achats */}
                        {userRole !== 'Responsable Achats' && userRole !== 'Responsable achats' && (
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mt-1"
                            checked={selectedIds.has(alimentation.id)}
                            onChange={() => toggleSelection(alimentation.id)}
                            aria-label={`Sélectionner ${alimentation.numero}`}
                          />
                        )}
                        <div>
                          <h3 className="font-bold text-[#793205] text-lg">{alimentation.numero}</h3>
                          <p className="text-xs text-gray-600">{alimentation.structure.ministere.name}</p>
                          <p className="text-xs text-gray-500">{alimentation.structure.name}</p>
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadgeColor(alimentation.statut)} font-semibold`}>
                        {getStatusLabel(alimentation.statut)}
                      </span>
                    </div>

                    {/* Informations produit */}
                    <div className="divider my-2"></div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Produit:</span>
                        <p className="font-medium text-[#793205]">{alimentation.produit.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <span className="text-xs text-gray-500">Quantité:</span>
                          <p className="font-semibold">{alimentation.quantite} {alimentation.produit.unit}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Prix unitaire:</span>
                          <p className="font-bold text-[#793205]">{alimentation.prixUnitaire.toLocaleString()} MRU</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Fournisseur:</span>
                        <p className="font-medium">{alimentation.fournisseurNom}</p>
                        {alimentation.fournisseurNIF && (
                          <p className="text-sm text-gray-500">NIF: {alimentation.fournisseurNIF}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Date:</span>
                        <p className="text-sm">{new Date(alimentation.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Documents */}
                    {alimentation.documents && alimentation.documents.length > 0 && (
                      <>
                        <div className="divider my-2"></div>
                        <div>
                          <span className="text-xs text-gray-500 mb-1 block">Documents:</span>
                          <div className="flex flex-wrap gap-2">
                            {alimentation.documents.map((doc) => (
                              <a
                                key={doc.id}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-xs btn-ghost gap-1"
                                title={doc.nom}
                              >
                                {doc.type === 'FACTURE' && '📄'}
                                {doc.type === 'PV_RECEPTION' && '📋'}
                                {doc.type === 'AUTRE' && '📎'}
                                <span className="truncate max-w-20">{doc.nom}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="divider my-2"></div>
                    <div className="flex gap-2 justify-end flex-wrap">
                      {/* Bouton historique */}
                      {alimentation.historiqueActions && alimentation.historiqueActions.length > 0 && (
                        <button
                          className={`btn btn-sm gap-2 ${viewedObservationsIds.has(alimentation.id) ? 'btn-success' : 'btn-info'
                            }`}
                          onClick={() => openHistoryModal(alimentation)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          {viewedObservationsIds.has(alimentation.id) ? '✓ ' : ''}Observations ({alimentation.historiqueActions.length})
                        </button>
                      )}

                      {/* Bouton documents */}
                      {alimentation.documents && alimentation.documents.length > 0 && (
                        <button
                          className="btn btn-sm btn-primary gap-2"
                          onClick={() => openDocumentsModal(alimentation)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          Documents ({alimentation.documents.length})
                        </button>
                      )}

                      {canEdit(alimentation) && (
                        <button
                          className="btn btn-sm btn-warning gap-2"
                          onClick={() => openEditModal(alimentation)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Modifier
                        </button>
                      )}
                      {canEditOrDelete(alimentation) && (
                        <button
                          className="btn btn-sm btn-error gap-2"
                          onClick={() => openActionModal(alimentation, 'delete')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Supprimer
                        </button>
                      )}
                      {getAvailableActions(alimentation).map((action) => {
                        if (action === 'maintenir-instance') {
                          return (
                            <button
                              key="maintenir-instance"
                              className="btn btn-sm btn-warning gap-2"
                              onClick={() => openActionModal(alimentation, 'maintenir-instance')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Maintenir en instance
                            </button>
                          );
                        } else if (action === 'instance') {
                          return (
                            <button
                              key="instance"
                              className="btn btn-sm btn-info gap-2"
                              onClick={() => openActionModal(alimentation, 'instance')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Instance
                            </button>
                          );
                        } else if (action === 'validate') {
                          return (
                            <button
                              key="validate"
                              className="btn btn-sm btn-success gap-2"
                              onClick={() => openActionModal(alimentation, 'validate')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Valider
                            </button>
                          );
                        } else if (action === 'reject') {
                          return (
                            <button
                              key="reject"
                              className="btn btn-sm btn-error gap-2"
                              onClick={() => openActionModal(alimentation, 'reject')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Rejeter
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}



        {/* Modal d'action */}
        {showActionModal && selectedAlimentation && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">
                {actionType === 'maintenir-instance' && 'Maintenir en instance'}
                {actionType === 'instance' && 'Mettre en instance'}
                {actionType === 'validate' && 'Valider'}
                {actionType === 'reject' && 'Rejeter'}
                {actionType === 'delete' && 'Supprimer'}
                {' - '}
                {selectedAlimentation.numero}
              </h3>

              <form onSubmit={handleAction}>
                {actionType === 'delete' ? (
                  <div className="alert alert-warning mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>Êtes-vous sûr de vouloir supprimer cette alimentation ?</span>
                  </div>
                ) : (
                  <div className="form-control mb-4">
                    <label className="label">Observations</label>
                    <textarea
                      className="textarea textarea-bordered"
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Saisir vos observations..."
                      rows={4}
                      required={actionType === 'instance' || actionType === 'reject'}
                    />
                  </div>
                )}

                <div className="modal-action">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowActionModal(false);
                      setObservations('');
                      setSelectedAlimentation(null);
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={`btn ${actionType === 'validate' ? 'btn-success' :
                        actionType === 'reject' || actionType === 'delete' ? 'btn-error' : 'btn-info'
                      }`}
                  >
                    {actionType === 'delete' ? 'Supprimer' : 'Confirmer'}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Modal pour créer une nouvelle alimentation */}
        <AlimentationModal mode="create" onSuccess={loadAlimentations} />

        {/* Modal pour modifier une alimentation */}
        {showEditModal && alimentationToEdit && (
          <AlimentationModal
            mode="edit"
            alimentation={alimentationToEdit}
            onSuccess={() => {
              setShowEditModal(false);
              setAlimentationToEdit(null);
              loadAlimentations();
            }}
          />
        )}

        {/* Modal d'historique des observations */}
        {showHistoryModal && selectedAlimentationHistory && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                Historique des observations - {selectedAlimentationHistory.numero}
              </h3>

              <div className="space-y-4">
                {selectedAlimentationHistory.historiqueActions && selectedAlimentationHistory.historiqueActions.length > 0 ? (
                  selectedAlimentationHistory.historiqueActions.map((action) => (
                    <div key={action.id} className="card bg-base-200 shadow">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`badge ${action.action === 'VALIDER' ? 'badge-success' :
                                action.action === 'REJETER' ? 'badge-error' :
                                  'badge-info'
                              } badge-sm`}>
                              {action.action}
                            </span>
                            <span className="ml-2 text-sm font-semibold">{action.userRole}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(action.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Statut: </span>
                          <span className="badge badge-ghost badge-sm">{getStatusLabel(action.ancienStatut)}</span>
                          <span className="mx-2">→</span>
                          <span className="badge badge-ghost badge-sm">{getStatusLabel(action.nouveauStatut)}</span>
                        </div>
                        {action.observations && (
                          <div className="mt-2 p-3 bg-base-100 rounded">
                            <p className="text-sm whitespace-pre-wrap">{action.observations}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Aucune observation disponible</span>
                  </div>
                )}

                {selectedAlimentationHistory.observations && (
                  <div className="card bg-warning/10 border border-warning">
                    <div className="card-body p-4">
                      <h4 className="font-semibold text-sm mb-2">📝 Observations actuelles</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedAlimentationHistory.observations}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedAlimentationHistory(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Modal des documents */}
        {showDocumentsModal && selectedAlimentationDocuments && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                📎 Documents - {selectedAlimentationDocuments.numero}
              </h3>

              <div className="space-y-3">
                {selectedAlimentationDocuments.documents && selectedAlimentationDocuments.documents.length > 0 ? (
                  selectedAlimentationDocuments.documents.map((doc) => (
                    <div key={doc.id} className="card bg-base-200 shadow hover:shadow-md transition-shadow">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              <h4 className="font-semibold text-sm">{doc.nom}</h4>
                              <span className="badge badge-primary badge-xs">{doc.type}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>Taille: {(doc.taille / 1024).toFixed(2)} Ko</p>
                              <p>Ajouté le: {new Date(doc.createdAt).toLocaleString('fr-FR')}</p>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                            Ouvrir
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Aucun document disponible</span>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    setShowDocumentsModal(false);
                    setSelectedAlimentationDocuments(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </Wrapper>
  );
};

export default AlimentationsPage;
