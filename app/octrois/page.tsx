'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Wrapper from '../components/Wrapper';
import { toast } from 'react-toastify';
import { readProduct } from '../actions';
import { Produit } from '@/type';

interface Octroi {
  id: string;
  numero: string;
  reference?: string;
  dateOctroi?: string;
  produitId: string;
  quantite: number;
  beneficiaireNom: string;
  beneficiaireTelephone?: string;
  statut: string;
  observations?: string;
  createdAt: string;
  isLocked: boolean;
  structureId: string;
  ministereId: string;
  produit: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    structureId: string;
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

const OctroisPage = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [octrois, setOctrois] = useState<Octroi[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [allProduits, setAllProduits] = useState<Produit[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedOctroi, setSelectedOctroi] = useState<Octroi | null>(null);
  const [actionType, setActionType] = useState<'instance' | 'validate' | 'reject'>('validate');
  const [observations, setObservations] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userStructureId, setUserStructureId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedOctroiHistory, setSelectedOctroiHistory] = useState<Octroi | null>(null);
  const [editingOctroi, setEditingOctroi] = useState<Octroi | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedOctroiDocuments, setSelectedOctroiDocuments] = useState<Octroi | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);

  // États pour la sélection multiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewedObservationsIds, setViewedObservationsIds] = useState<Set<string>>(new Set());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  // État pour le filtrage par statut
  const [statusFilter, setStatusFilter] = useState<string>('TOUS');

  // Données du formulaire de création
  const [formData, setFormData] = useState({
    structureId: '',
    produitId: '',
    quantite: 1,
    beneficiaireDenomination: '',
    dateOctroi: new Date().toISOString().split('T')[0],
    reference: ''
  });

  // Charger le rôle de l'utilisateur
  useEffect(() => {
    const loadUserRole = async () => {
      if (!(user as any)?.id) return;
      
      try {
        const response = await fetch(`/api/user/${(user as any).id}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du rôle');
        }
        
        const result = await response.json();
        const userData = result.user || result;
        const roleName = userData.isAdmin ? 'Admin' : (userData.role?.name || '');
        const structureId = userData.structureId;
        setUserRole(roleName);
        setUserStructureId(structureId || null);
      } catch (error) {
        console.error('Erreur lors du chargement du rôle:', error);
      }
    };

    if (status === 'authenticated' && (user as any)?.id) {
      loadUserRole();
    }
  }, [status, (user as any)?.id]);

  // Vérifier si l'utilisateur peut créer/modifier/supprimer des octrois
  const canManageOctrois = () => {
    const authorizedRoles = ['Responsable Achats', 'Responsable achats', 'Agent de saisie', 'Admin'];
    return authorizedRoles.includes(userRole);
  };

  // Vérifier si l'utilisateur peut modifier/supprimer un octroi spécifique
  const canEditOrDeleteOctroi = (octroi: Octroi) => {
    if (!canManageOctrois()) return false;

    // L'octroi doit être en statut SAISIE, INSTANCE_DIRECTEUR, INSTANCE_ORDONNATEUR ou REJETE et non verrouillé (sauf REJETE qui est verrouillé)
    const editableStatuses = ['SAISIE', 'INSTANCE_DIRECTEUR', 'INSTANCE_ORDONNATEUR', 'REJETE'];
    if (!editableStatuses.includes(octroi.statut)) return false;

    // Pour REJETE, on permet la suppression même si verrouillé
    if (octroi.statut !== 'REJETE' && octroi.isLocked) return false;

    // Agent de saisie: seulement sa structure
    if (userRole === 'Agent de saisie') {
      return userStructureId === octroi.produit.structureId;
    }

    // Responsable achats: toutes les structures de son ministère
    return true;
  };

  // Déterminer les actions disponibles pour un octroi selon le rôle et le statut
  const getAvailableActions = (octroi: Octroi): ('instance' | 'validate' | 'reject')[] => {
    if (octroi.isLocked) return [];
    
    // Si le rôle n'est pas encore chargé, ne retourner aucune action
    if (!userRole) return [];

    const actions: ('instance' | 'validate' | 'reject')[] = [];
    
    // Normaliser le rôle pour comparaison (minuscules, sans accents)
    const normalizedRole = userRole.toLowerCase().trim();

    // Admin
    if (userRole === 'Admin') {
      if (octroi.statut === 'SAISIE') {
        actions.push('instance', 'validate', 'reject');
      }
      else if (octroi.statut === 'INSTANCE_DIRECTEUR') {
        actions.push('validate', 'reject');
      }
      else if (octroi.statut === 'VALIDE_DIRECTEUR') {
        actions.push('validate', 'reject');
      }
      else if (octroi.statut === 'VALIDE_FINANCIER') {
        actions.push('instance', 'validate', 'reject');
      }
      else if (octroi.statut === 'INSTANCE_ORDONNATEUR') {
        actions.push('validate', 'reject');
      }
    }
    // Directeur (toutes variantes)
    else if (normalizedRole.includes('directeur') && !normalizedRole.includes('financier')) {
      // Directeur peut valider ou mettre en instance depuis SAISIE (PAS de rejet)
      if (octroi.statut === 'SAISIE') {
        actions.push('instance', 'validate');
      }
      // Directeur peut valider depuis INSTANCE_DIRECTEUR (PAS de rejet)
      else if (octroi.statut === 'INSTANCE_DIRECTEUR') {
        actions.push('validate');
      }
    }
    // Directeur Financier ou Responsable Financier (toutes variantes)
    else if (normalizedRole.includes('financier')) {
      // Dir. Financier et Responsable financier peuvent UNIQUEMENT valider depuis VALIDE_DIRECTEUR
      if (octroi.statut === 'VALIDE_DIRECTEUR') {
        actions.push('validate');
      }
    }
    // Ordonnateur
    else if (normalizedRole === 'ordonnateur') {
      // Ordonnateur peut valider, mettre en instance ou rejeter depuis VALIDE_FINANCIER
      if (octroi.statut === 'VALIDE_FINANCIER') {
        actions.push('instance', 'validate', 'reject');
      }
      // Ordonnateur peut valider ou rejeter depuis INSTANCE_ORDONNATEUR
      else if (octroi.statut === 'INSTANCE_ORDONNATEUR') {
        actions.push('validate', 'reject');
      }
    }

    return actions;
  };

  // Déterminer les statuts pertinents pour chaque rôle
  const getRelevantStatuses = () => {
    const normalizedRole = userRole.toLowerCase().trim();
    
    if (userRole === 'Admin') {
      // Admin peut voir tous les statuts
      return ['TOUS', 'SAISIE', 'VALIDE_DIRECTEUR', 'VALIDE_FINANCIER', 'VALIDE_ORDONNATEUR', 'REJETE'];
    }
    else if (normalizedRole.includes('directeur') && !normalizedRole.includes('financier')) {
      // Directeur voit : SAISIE (= Instance Directeur, à traiter) et VALIDE_DIRECTEUR (traités)
      return ['TOUS', 'SAISIE', 'VALIDE_DIRECTEUR'];
    }
    else if (normalizedRole.includes('financier')) {
      // Directeur financier voit : VALIDE_DIRECTEUR (= Instance Financier, à traiter) et VALIDE_FINANCIER (traités)
      return ['TOUS', 'VALIDE_DIRECTEUR', 'VALIDE_FINANCIER'];
    }
    else if (normalizedRole === 'ordonnateur') {
      // Ordonnateur voit : VALIDE_FINANCIER (= Instance Ordonnateur, à traiter) et VALIDE_ORDONNATEUR (traités)
      return ['TOUS', 'VALIDE_FINANCIER', 'VALIDE_ORDONNATEUR'];
    }
    else if (normalizedRole === 'agent de saisie' || normalizedRole.includes('responsable')) {
      // Agent et Responsable voient : leurs saisies
      return ['TOUS', 'SAISIE', 'REJETE'];
    }
    
    return ['TOUS'];
  };

  // Filtrer les octrois selon le statut et le rôle
  const getFilteredOctrois = () => {
    let filtered = octrois;
    
    // Si un statut spécifique est sélectionné (pas TOUS), filtrer par ce statut
    if (statusFilter !== 'TOUS') {
      filtered = filtered.filter(o => o.statut === statusFilter);
      return filtered;
    }
    
    // Si statusFilter === 'TOUS', afficher tous les octrois sans filtrage supplémentaire
    // (l'utilisateur verra tous les octrois, y compris ceux déjà traités)
    return filtered;
  };

  // Charger les octrois
  const loadOctrois = useCallback(async () => {
    try {
      const response = await fetch('/api/octrois');
      const result = await response.json();

      if (result.success) {
        setOctrois(result.data || []);
      } else {
        toast.error(result.message || 'Erreur lors du chargement des octrois');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des octrois');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les structures disponibles pour Responsable Achats
  const loadStructures = useCallback(async () => {
    if (!(user as any)?.id) return;
    
    try {
      if (userRole === 'Responsable Achats' || userRole === 'Responsable achats') {
        const response = await fetch(`/api/user/${(user as any).id}`);
        
        if (!response.ok) return;
        
        const result = await response.json();
        const userData = result.user || result; // Handle wrapped response
        const userMinistereId = userData.ministereId;

        console.log('🔍 Chargement structures - ministereId:', userMinistereId);

        if (userMinistereId) {
          const ministeresResponse = await fetch(`/api/ministeres/${userMinistereId}`);
          const ministeresData = await ministeresResponse.json();

          console.log('📋 Structures reçues:', ministeresData);

          if (ministeresData.success && ministeresData.data) {
            const allStructures = ministeresData.data.structures || [];
            console.log('✅ Structures chargées:', allStructures.length);
            setStructures(allStructures);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des structures:', error);
      toast.error('Erreur lors du chargement des structures');
    }
  }, [userRole]);

  // Charger tous les produits du système (pour le modal d'état du stock)
  const loadAllProduits = useCallback(async () => {
    try {
      const response = await fetch('/api/produits');
      const result = await response.json();
      if (result.success) {
        setAllProduits(result.data || []);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de tous les produits:', error);
      toast.error('Erreur lors du chargement des produits');
    }
  }, []);

  // Charger les produits pour le formulaire de création
  const loadProduits = useCallback(async () => {
    try {
      // Pour Responsable Achats, charger les produits selon la structure sélectionnée
      if ((userRole === 'Responsable Achats' || userRole === 'Responsable achats') && formData.structureId) {
        console.log('🔍 Chargement produits - structureId:', formData.structureId);
        const produitsData = await readProduct(formData.structureId);
        console.log('📦 Produits reçus:', produitsData?.length || 0);
        setProduits(produitsData || []);
      }
      // Pour Agent de saisie, charger les produits de sa structure
      else if (userRole === 'Agent de saisie' && userStructureId) {
        console.log('🔍 Chargement produits Agent - structureId:', userStructureId);
        const produitsData = await readProduct(userStructureId);
        console.log('📦 Produits Agent reçus:', produitsData?.length || 0);
        setProduits(produitsData || []);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
    }
  }, [userRole, formData.structureId, userStructureId]);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      loadOctrois();
    }
  }, [status === 'authenticated', user, loadOctrois]);

  // Charger les structures quand le rôle est disponible
  useEffect(() => {
    if (userRole) {
      console.log('🎯 Tentative chargement structures - rôle:', userRole);
      loadStructures();
    }
  }, [userRole, loadStructures]);

  // Charger les produits quand la structure est sélectionnée ou pour Agent de saisie
  useEffect(() => {
    const shouldLoadProduits =
      (userRole === 'Responsable Achats' || userRole === 'Responsable achats') && formData.structureId ||
      userRole === 'Agent de saisie' && userStructureId;

    if (shouldLoadProduits) {
      console.log('🎯 Tentative chargement produits - rôle:', userRole, 'structure:', formData.structureId || userStructureId);
      loadProduits();
    }
  }, [userRole, formData.structureId, userStructureId, loadProduits]);

  // Calculer les quantités en attente pour un produit (en excluant l'octroi en cours d'édition)
  const getQuantiteEnAttente = (produitId: string, excludeOctroiId?: string) => {
    return octrois
      .filter(o =>
        o.produitId === produitId &&
        o.id !== excludeOctroiId && // Exclure l'octroi en cours d'édition
        ['SAISIE', 'INSTANCE_DIRECTEUR', 'VALIDE_DIRECTEUR', 'VALIDE_FINANCIER', 'INSTANCE_ORDONNATEUR'].includes(o.statut)
      )
      .reduce((total, o) => total + o.quantite, 0);
  };

  // Calculer l'état détaillé du stock pour tous les produits
  const getStockDetails = () => {
    return allProduits.map(produit => {
      const quantiteEnAttente = getQuantiteEnAttente(produit.id);
      const stockTheorique = produit.quantity - quantiteEnAttente;
      return {
        produit,
        stockDepart: produit.quantity,
        quantiteEnAttente,
        stockTheorique
      };
    });
  };

  // Ouvrir le modal de visualisation du stock
  const openStockModal = async () => {
    await loadAllProduits();
    setShowStockModal(true);
  };

  // Créer un nouvel octroi
  const handleCreateOctroi = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const isEditing = editingOctroi !== null;
      const url = isEditing ? `/api/octrois/${editingOctroi.id}` : '/api/octrois';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structureId: formData.structureId || userStructureId,
          produitId: formData.produitId,
          quantite: formData.quantite,
          beneficiaireNom: formData.beneficiaireDenomination,
          dateOctroi: formData.dateOctroi,
          reference: formData.reference
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Upload des documents si présents (uniquement pour nouvelle création)
        if (!isEditing && uploadedFiles.length > 0 && result.data?.id) {
          for (const file of uploadedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('octroiId', result.data.id);
            formData.append('type', 'PV_OCTROI');

            try {
              await fetch('/api/octrois/documents/upload', {
                method: 'POST',
                body: formData,
              });
            } catch (error) {
              console.error('Erreur upload document:', error);
            }
          }
        }

        toast.success(result.message);
        setShowCreateModal(false);
        setEditingOctroi(null);
        setFormData({
          structureId: '',
          produitId: '',
          quantite: 1,
          beneficiaireDenomination: '',
          dateOctroi: new Date().toISOString().split('T')[0],
          reference: ''
        });
        setUploadedFiles([]);
        loadOctrois();
      } else {
        toast.error(result.message || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} de l'octroi`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(`Erreur lors de ${editingOctroi ? 'la modification' : 'la création'} de l'octroi`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effectuer une action sur un octroi
  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOctroi) return;

    try {
      const response = await fetch(`/api/octrois/${selectedOctroi.id}/${actionType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observations }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setShowActionModal(false);
        setObservations('');
        setSelectedOctroi(null);
        loadOctrois();

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

  // Ouvrir le modal d'action
  const openActionModal = (octroi: Octroi, action: 'instance' | 'validate' | 'reject') => {
    setSelectedOctroi(octroi);
    setActionType(action);
    setShowActionModal(true);
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case 'SAISIE': return 'badge-warning';
      case 'INSTANCE_FINANCIER': return 'badge-info';
      case 'VALIDE_FINANCIER': return 'badge-primary';
      case 'INSTANCE_DIRECTEUR': return 'badge-info';
      case 'VALIDE_DIRECTEUR': return 'badge-primary';
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
    const filteredOctrois = getFilteredOctrois();
    if (selectedIds.size === filteredOctrois.length && filteredOctrois.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOctrois.map(o => o.id)));
    }
  };

  // Marquer un octroi comme ayant ses observations consultées
  const markObservationsViewed = (id: string) => {
    setViewedObservationsIds(prev => new Set(prev).add(id));
  };

  // Ouvrir le modal d'historique et marquer comme consulté
  const openHistoryModal = (octroi: Octroi) => {
    setSelectedOctroiHistory(octroi);
    setShowHistoryModal(true);
    markObservationsViewed(octroi.id);
  };

  // Ouvrir le modal des documents
  const openDocumentsModal = (octroi: Octroi) => {
    setSelectedOctroiDocuments(octroi);
    setShowDocumentsModal(true);
  };

  // Exécuter une action groupée
  const executeBulkAction = async (action: 'instance' | 'validate' | 'reject') => {
    if (selectedIds.size === 0) {
      toast.warning('Aucun octroi sélectionné');
      return;
    }

    // Vérifier que tous les octrois sélectionnés ont leurs observations consultées
    const notViewed = Array.from(selectedIds).filter(id => !viewedObservationsIds.has(id));
    if (notViewed.length > 0) {
      toast.error('Vous devez d\'abord consulter les observations de tous les octrois sélectionnés');
      return;
    }

    // Demander confirmation
    const confirmMessage = `Êtes-vous sûr de vouloir ${action === 'validate' ? 'valider' : action === 'reject' ? 'rejeter' : 'mettre en instance'
      } ${selectedIds.size} octroi(s) ?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkActionInProgress(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const endpoint = action === 'reject'
          ? `/api/octrois/${id}/reject`
          : action === 'instance'
            ? `/api/octrois/${id}/instance`
            : `/api/octrois/${id}/validate`;

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
          console.error(`Erreur pour ${id}:`, result.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`Erreur pour ${id}:`, error);
      }
    }

    setBulkActionInProgress(false);

    if (successCount > 0) {
      toast.success(`${successCount} octroi(s) traité(s) avec succès`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erreur(s) rencontrée(s)`);
    }

    // Réinitialiser et recharger
    setSelectedIds(new Set());
    setViewedObservationsIds(new Set());
    setObservations('');
    loadOctrois();

    // Déclencher l'événement de mise à jour du stock pour rafraîchir les autres pages
    if (successCount > 0) {
      window.dispatchEvent(new CustomEvent('stockUpdated'));
    }
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
          <p>Veuillez vous connecter pour accéder aux octrois.</p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#793205]">Gestion des Octrois</h1>
          <div className="flex gap-2 items-center">
            {userRole && (
              <span className="badge badge-outline">{userRole}</span>
            )}
            <button
              className="btn btn-outline btn-info"
              onClick={openStockModal}
              title="Visualiser l'état du stock"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              État du stock
            </button>
            {canManageOctrois() && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingOctroi(null);
                  setFormData({
                    structureId: '',
                    produitId: '',
                    quantite: 1,
                    beneficiaireDenomination: '',
                    dateOctroi: new Date().toISOString().split('T')[0],
                    reference: ''
                  });
                  setUploadedFiles([]);
                  setShowCreateModal(true);
                }}
              >
                Nouvel Octroi
              </button>
            )}
          </div>
        </div>

        {/* Filtre par statut */}
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
                  {status === 'TOUS' && '📋 Tous'}
                  {status === 'SAISIE' && '⏳ Instance Directeur'}
                  {status === 'VALIDE_DIRECTEUR' && '⏳ Instance Financier'}
                  {status === 'VALIDE_FINANCIER' && '⏳ Instance Ordonnateur'}
                  {status === 'VALIDE_ORDONNATEUR' && '✅ Validé Final'}
                  {status === 'REJETE' && '❌ Rejeté'}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {statusFilter === 'TOUS' && `📌 Affichage de tous les octrois (${getFilteredOctrois().length})`}
            {statusFilter !== 'TOUS' && `📌 Affichage des octrois avec le statut : ${statusFilter} (${getFilteredOctrois().length})`}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-[#F1D2BF]"></span>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Barre d'actions groupées */}
            {selectedIds.size > 0 && (
              <div className="mb-4 p-4 bg-base-200 rounded-lg flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{selectedIds.size} octroi(s) sélectionné(s)</span>
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
                  {/* Bouton Mettre en instance - Pas pour les financiers */}
                  {!userRole.toLowerCase().includes('financier') && (
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => executeBulkAction('instance')}
                      disabled={bulkActionInProgress}
                    >
                      {bulkActionInProgress ? <span className="loading loading-spinner loading-xs"></span> : '⏳ Mettre en instance'}
                    </button>
                  )}
                  {/* Bouton Valider - Pour tous */}
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => executeBulkAction('validate')}
                    disabled={bulkActionInProgress}
                  >
                    {bulkActionInProgress ? <span className="loading loading-spinner loading-xs"></span> : '✅ Valider'}
                  </button>
                  {/* Bouton Rejeter - Uniquement pour Admin et Ordonnateur */}
                  {(userRole === 'Admin' || userRole === 'Ordonnateur') && (
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
                    <th className="text-sm font-semibold">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={selectedIds.size === getFilteredOctrois().length && getFilteredOctrois().length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Sélectionner tout"
                      />
                    </th>
                    <th className="text-sm font-semibold">Date</th>
                    <th className="text-sm font-semibold">Référence</th>
                    <th className="text-sm font-semibold">Produit</th>
                    <th className="text-sm font-semibold">Quantité octroyée</th>
                    <th className="text-sm font-semibold">Stock</th>
                    <th className="text-sm font-semibold">Bénéficiaire</th>
                    <th className="text-sm font-semibold">Statut</th>
                    <th className="text-sm font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredOctrois().map((octroi) => (
                    <tr key={octroi.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={selectedIds.has(octroi.id)}
                          onChange={() => toggleSelection(octroi.id)}
                          aria-label={`Sélectionner ${octroi.numero}`}
                        />
                      </td>
                      <td className="py-2">
                        <div className="font-bold text-[#793205] text-xs">{new Date(octroi.dateOctroi || octroi.createdAt).toLocaleDateString('fr-FR')}</div>
                        <div className="text-[10px] text-gray-600 truncate max-w-[120px]" title={octroi.structure.ministere.name}>
                          {octroi.structure.ministere.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[120px]" title={octroi.structure.name}>
                          {octroi.structure.name}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="font-bold text-[#793205] text-xs">{octroi.numero}</div>
                        {octroi.reference && (
                          <div className="text-[10px] text-gray-500">Réf: {octroi.reference}</div>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="font-medium text-[#793205] text-xs truncate max-w-[100px]" title={octroi.produit.name}>
                          {octroi.produit.name}
                        </div>
                      </td>
                      <td className="font-semibold text-xs py-2 whitespace-nowrap">{octroi.quantite} {octroi.produit.unit}</td>
                      <td className="py-2">
                        <div className={`font-semibold text-xs whitespace-nowrap ${octroi.produit.quantity >= octroi.quantite ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {octroi.produit.quantity} {octroi.produit.unit}
                        </div>
                        {octroi.produit.quantity < octroi.quantite && (
                          <div className="badge badge-error badge-xs text-[9px]">⚠️</div>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="font-medium text-xs truncate max-w-[120px]" title={octroi.beneficiaireNom}>
                          {octroi.beneficiaireNom}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${getStatusBadgeColor(octroi.statut)} badge-sm font-semibold whitespace-nowrap px-2 py-2 text-[10px]`}>
                            {getStatusLabel(octroi.statut)}
                          </span>
                          {octroi.isLocked && (
                            <span className="badge badge-ghost badge-xs whitespace-nowrap text-[9px]">
                              🔒
                            </span>
                          )}
                          {octroi.historiqueActions && octroi.historiqueActions.length > 0 && (
                            <button
                              onClick={() => openHistoryModal(octroi)}
                              className={`badge badge-xs whitespace-nowrap text-[9px] cursor-pointer ${viewedObservationsIds.has(octroi.id) ? 'badge-success' : 'badge-info hover:badge-primary'
                                }`}
                              title={viewedObservationsIds.has(octroi.id) ? "Observations consultées" : "Voir les observations"}
                            >
                              {viewedObservationsIds.has(octroi.id) ? '✓ ' : '💬 '}{octroi.historiqueActions.length}
                            </button>
                          )}
                          {octroi.documents && octroi.documents.length > 0 && (
                            <button
                              onClick={() => openDocumentsModal(octroi)}
                              className="badge badge-primary badge-xs whitespace-nowrap text-[9px] cursor-pointer hover:badge-secondary"
                              title="Voir les documents"
                            >
                              📎 {octroi.documents.length}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1 justify-center items-center flex-wrap">
                          {/* Boutons Modifier/Supprimer pour Responsable Achats et Agent de saisie */}
                          {canEditOrDeleteOctroi(octroi) && (
                            <>
                              <button
                                className="btn btn-xs btn-circle btn-warning hover:scale-110 transition-transform tooltip"
                                onClick={() => {
                                  setEditingOctroi(octroi);
                                  setFormData({
                                    structureId: octroi.structureId,
                                    produitId: octroi.produitId,
                                    quantite: octroi.quantite,
                                    beneficiaireDenomination: octroi.beneficiaireNom,
                                    dateOctroi: new Date(octroi.dateOctroi || octroi.createdAt).toISOString().split('T')[0],
                                    reference: octroi.reference || ''
                                  });
                                  setShowCreateModal(true);
                                }}
                                data-tip="Modifier"
                                aria-label="Modifier l'octroi"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button
                                className="btn btn-xs btn-circle btn-error hover:scale-110 transition-transform tooltip"
                                onClick={async () => {
                                  if (confirm(`Êtes-vous sûr de vouloir supprimer l'octroi ${octroi.numero} ?`)) {
                                    try {
                                      const response = await fetch(`/api/octrois/${octroi.id}`, {
                                        method: 'DELETE',
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success('Octroi supprimé avec succès');
                                        loadOctrois();
                                      } else {
                                        toast.error(result.message || 'Erreur lors de la suppression');
                                      }
                                    } catch (error) {
                                      console.error('Erreur:', error);
                                      toast.error('Erreur lors de la suppression');
                                    }
                                  }
                                }}
                                data-tip="Supprimer"
                                aria-label="Supprimer l'octroi"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Actions workflow selon le rôle */}
                          {getAvailableActions(octroi).map((action) => {
                            if (action === 'instance') {
                              return (
                                <button
                                  key="instance"
                                  className="btn btn-xs btn-circle btn-info hover:scale-110 transition-transform tooltip"
                                  onClick={() => openActionModal(octroi, 'instance')}
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
                                  onClick={() => openActionModal(octroi, 'validate')}
                                  data-tip="Valider"
                                  aria-label="Valider l'octroi"
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
                                  onClick={() => openActionModal(octroi, 'reject')}
                                  data-tip="Rejeter"
                                  aria-label="Rejeter l'octroi"
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
                          {!canEditOrDeleteOctroi(octroi) && getAvailableActions(octroi).length === 0 && (
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
              {getFilteredOctrois().map((octroi) => (
                <div key={octroi.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body p-4">
                    {/* En-tête */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm mt-1"
                          checked={selectedIds.has(octroi.id)}
                          onChange={() => toggleSelection(octroi.id)}
                          aria-label={`Sélectionner ${octroi.numero}`}
                        />
                        <div>
                          <h3 className="font-bold text-[#793205] text-lg">{octroi.numero}</h3>
                          {octroi.reference && (
                            <p className="text-xs text-gray-500">Réf: {octroi.reference}</p>
                          )}
                          <p className="text-xs text-gray-600">{octroi.structure.ministere.name}</p>
                          <p className="text-xs text-gray-500">{octroi.structure.name}</p>
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadgeColor(octroi.statut)} font-semibold`}>
                        {getStatusLabel(octroi.statut)}
                      </span>
                    </div>

                    {/* Informations produit */}
                    <div className="divider my-2"></div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Produit:</span>
                        <p className="font-medium text-[#793205]">{octroi.produit.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <span className="text-xs text-gray-500">Quantité octroyée:</span>
                          <p className="font-semibold">{octroi.quantite} {octroi.produit.unit}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Stock:</span>
                          <p className={`font-semibold ${octroi.produit.quantity >= octroi.quantite ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {octroi.produit.quantity} {octroi.produit.unit}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Bénéficiaire:</span>
                        <p className="font-medium">{octroi.beneficiaireNom}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Date:</span>
                        <p className="text-sm">{new Date(octroi.dateOctroi || octroi.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="divider my-2"></div>
                    <div className="flex gap-2 justify-end flex-wrap">
                      {/* Bouton historique */}
                      {octroi.historiqueActions && octroi.historiqueActions.length > 0 && (
                        <button
                          className={`btn btn-sm gap-2 ${viewedObservationsIds.has(octroi.id) ? 'btn-success' : 'btn-info'
                            }`}
                          onClick={() => openHistoryModal(octroi)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          {viewedObservationsIds.has(octroi.id) ? '✓ ' : ''}Observations ({octroi.historiqueActions.length})
                        </button>
                      )}

                      {/* Bouton documents */}
                      {octroi.documents && octroi.documents.length > 0 && (
                        <button
                          className="btn btn-sm btn-primary gap-2"
                          onClick={() => openDocumentsModal(octroi)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          Documents ({octroi.documents.length})
                        </button>
                      )}

                      {/* Boutons Modifier/Supprimer pour Responsable Achats et Agent de saisie */}
                      {canEditOrDeleteOctroi(octroi) && (
                        <>
                          <button
                            className="btn btn-sm btn-warning gap-2"
                            onClick={() => {
                              setEditingOctroi(octroi);
                              setFormData({
                                structureId: octroi.structureId,
                                produitId: octroi.produitId,
                                quantite: octroi.quantite,
                                beneficiaireDenomination: octroi.beneficiaireNom,
                                dateOctroi: new Date(octroi.dateOctroi || octroi.createdAt).toISOString().split('T')[0],
                                reference: octroi.reference || ''
                              });
                              setShowCreateModal(true);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Modifier
                          </button>
                          <button
                            className="btn btn-sm btn-error gap-2"
                            onClick={async () => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer l'octroi ${octroi.numero} ?`)) {
                                try {
                                  const response = await fetch(`/api/octrois/${octroi.id}`, {
                                    method: 'DELETE',
                                  });
                                  const result = await response.json();
                                  if (result.success) {
                                    toast.success('Octroi supprimé avec succès');
                                    loadOctrois();
                                  } else {
                                    toast.error(result.message || 'Erreur lors de la suppression');
                                  }
                                } catch (error) {
                                  console.error('Erreur:', error);
                                  toast.error('Erreur lors de la suppression');
                                }
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Supprimer
                          </button>
                        </>
                      )}

                      {/* Actions workflow */}
                      {getAvailableActions(octroi).map((action) => {
                        if (action === 'instance') {
                          return (
                            <button
                              key="instance"
                              className="btn btn-sm btn-info gap-2"
                              onClick={() => openActionModal(octroi, 'instance')}
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
                              onClick={() => openActionModal(octroi, 'validate')}
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
                              onClick={() => openActionModal(octroi, 'reject')}
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

        {/* Modal de création */}
        {showCreateModal && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <form method="dialog">
                <button
                  className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </form>

              <h3 className="font-bold text-lg mb-6">
                {editingOctroi ? '✏️ Modifier l\'Octroi' : '📤 Nouvel Octroi'}
              </h3>

              <form onSubmit={handleCreateOctroi} className="space-y-4">
                {/* Sélection de la structure (Responsable Achats uniquement) */}
                {(userRole === 'Responsable Achats' || userRole === 'Responsable achats') && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Structure *</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.structureId}
                      onChange={(e) => {
                        setFormData({ ...formData, structureId: e.target.value, produitId: '' });
                        setProduits([]);
                      }}
                      required
                    >
                      <option value="">Sélectionner une structure...</option>
                      {structures.map((structure) => (
                        <option key={structure.id} value={structure.id}>
                          {structure.name}
                        </option>
                      ))}
                    </select>
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Sélectionnez d&apos;abord la structure pour voir les produits disponibles
                      </span>
                    </label>
                  </div>
                )}

                {/* Sélection du produit */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Produit *</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.produitId}
                    onChange={(e) => setFormData({ ...formData, produitId: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un produit...</option>
                    {produits.map((produit) => (
                      <option key={produit.id} value={produit.id}>
                        {produit.name} - Stock disponible: {produit.quantity} {produit.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Détails du produit sélectionné */}
                {formData.produitId && (() => {
                  const selectedProduct = produits.find(p => p.id === formData.produitId);
                  if (!selectedProduct) return null;

                  const quantiteEnAttente = getQuantiteEnAttente(selectedProduct.id, editingOctroi?.id);
                  const stockTheorique = selectedProduct.quantity - quantiteEnAttente;

                  return (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {selectedProduct.name}
                      </h4>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Stock de départ :</span>
                          <span className="font-medium text-gray-900">
                            {selectedProduct.quantity} {selectedProduct.unit}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Quantités en attente :</span>
                          <span className="font-medium text-orange-600">
                            -{quantiteEnAttente} {selectedProduct.unit}
                          </span>
                        </div>

                        <div className="pt-1.5 border-t border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Stock final théorique :</span>
                            <span className={`font-bold ${stockTheorique > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {stockTheorique} {selectedProduct.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 pt-2 border-t border-blue-100">
                        Le stock final théorique tient compte des octrois en attente de validation définitive.
                      </p>
                    </div>
                  );
                })()}

                {/* Quantité */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Quantité *</span>
                    {formData.produitId && (() => {
                      const selectedProduct = produits.find(p => p.id === formData.produitId);
                      return selectedProduct ? (
                        <span className="label-text-alt text-xs">
                          Unité: {selectedProduct.unit}
                        </span>
                      ) : null;
                    })()}
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={formData.quantite || ''}
                    onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                    placeholder="Quantité à octroyer"
                  />
                  {formData.produitId && formData.quantite > 0 && (() => {
                    const selectedProduct = produits.find(p => p.id === formData.produitId);
                    if (!selectedProduct) return null;

                    const quantiteEnAttente = getQuantiteEnAttente(selectedProduct.id, editingOctroi?.id);
                    const stockTheorique = selectedProduct.quantity - quantiteEnAttente;

                    if (formData.quantite > stockTheorique) {
                      return (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            ⚠️ La quantité demandée dépasse le stock théorique disponible ({stockTheorique} {selectedProduct.unit})
                          </span>
                        </label>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Divider */}
                <div className="divider">Informations du Bénéficiaire</div>

                {/* Dénomination du Bénéficiaire */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Dénomination du Bénéficiaire *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.beneficiaireDenomination}
                    onChange={(e) => setFormData({ ...formData, beneficiaireDenomination: e.target.value })}
                    required
                    placeholder="Nom complet du bénéficiaire"
                  />
                </div>

                {/* Divider */}
                <div className="divider">Détails de l'Octroi</div>

                {/* Date de l'octroi */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Date de l'Octroi *</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={formData.dateOctroi}
                    onChange={(e) => setFormData({ ...formData, dateOctroi: e.target.value })}
                    required
                  />
                </div>

                {/* Référence de l'octroi */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Référence</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Référence du document d'octroi (optionnel)"
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">Exemple: PV-2024-001, REF-MSE-123, etc.</span>
                  </label>
                </div>

                {/* Upload de documents */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Documents (PV d'octroi, etc.)</span>
                  </label>
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadedFiles(Array.from(e.target.files));
                      }
                    }}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Formats acceptés: PDF, JPG, PNG, DOC, DOCX. Plusieurs fichiers possibles.
                    </span>
                  </label>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-semibold">Fichiers sélectionnés :</span>
                      <ul className="list-disc list-inside text-sm text-base-content/70">
                        {uploadedFiles.map((file, index) => (
                          <li key={index}>
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="modal-action">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !formData.produitId || formData.quantite <= 0 || (() => {
                      const selectedProduct = produits.find(p => p.id === formData.produitId);
                      return selectedProduct ? formData.quantite > selectedProduct.quantity : false;
                    })()}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {editingOctroi ? 'Modification...' : 'Création...'}
                      </>
                    ) : (
                      <>{editingOctroi ? 'Modifier' : 'Créer'} l'Octroi</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Modal d'action */}
        {showActionModal && selectedOctroi && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                {actionType === 'instance' && '📋 Mettre en instance'}
                {actionType === 'validate' && '✓ Valider'}
                {actionType === 'reject' && '✗ Rejeter'}
                {' - '}
                {selectedOctroi.numero}
              </h3>

              {/* Message d'information selon l'action */}
              <div className={`alert mb-4 ${actionType === 'instance' ? 'alert-info' :
                  actionType === 'validate' ? 'alert-success' :
                    'alert-error'
                }`}>
                <div className="text-sm">
                  {actionType === 'instance' && userRole === 'Directeur' && (
                    <p>L'octroi sera retourné au responsable des achats ou agent de saisie pour modification.</p>
                  )}
                  {actionType === 'instance' && userRole === 'Ordonnateur' && (
                    <p>L'octroi sera retourné au directeur de la structure qui le remettra en instance pour modification par l'agent/responsable achats.</p>
                  )}
                  {actionType === 'validate' && userRole === 'Directeur' && (
                    <p>L'octroi sera transmis au directeur financier pour validation.</p>
                  )}
                  {actionType === 'validate' && (userRole === 'Directeur Financier' || userRole === 'Directeur financier' || userRole === 'Responsable financier') && (
                    <p>L'octroi sera transmis à l'ordonnateur pour validation finale.</p>
                  )}
                  {actionType === 'validate' && userRole === 'Ordonnateur' && (
                    <p><strong>⚠️ Attention :</strong> Cette action est finale. Le stock sera mouvementé (sortie) et une transaction sera créée. L'octroi sera verrouillé.</p>
                  )}
                  {actionType === 'reject' && (
                    <p><strong>⚠️ Attention :</strong> L'octroi sera rejeté définitivement. Aucun mouvement de stock ne sera effectué. Il pourra être supprimé par l'agent/responsable achats.</p>
                  )}
                </div>
              </div>

              {/* Informations de l'octroi */}
              <div className="bg-base-200 p-4 rounded-lg mb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-semibold">Produit:</span> {selectedOctroi.produit.name}</div>
                  <div><span className="font-semibold">Quantité:</span> {selectedOctroi.quantite} {selectedOctroi.produit.unit}</div>
                  <div><span className="font-semibold">Stock actuel:</span> {selectedOctroi.produit.quantity} {selectedOctroi.produit.unit}</div>
                  <div><span className="font-semibold">Date:</span> {new Date(selectedOctroi.dateOctroi || selectedOctroi.createdAt).toLocaleDateString('fr-FR')}</div>
                  {selectedOctroi.reference && (
                    <div className="col-span-2"><span className="font-semibold">Référence:</span> {selectedOctroi.reference}</div>
                  )}
                  <div><span className="font-semibold">Statut:</span> <span className={`badge ${getStatusBadgeColor(selectedOctroi.statut)}`}>{getStatusLabel(selectedOctroi.statut)}</span></div>
                  <div className="col-span-2"><span className="font-semibold">Bénéficiaire:</span> {selectedOctroi.beneficiaireNom}</div>
                </div>
              </div>

              <form onSubmit={handleAction}>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Observations {(actionType === 'instance' || actionType === 'reject') && <span className="text-error">*</span>}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Saisir vos observations..."
                    rows={4}
                    required={actionType === 'instance' || actionType === 'reject'}
                  />
                  {(actionType === 'instance' || actionType === 'reject') && (
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Les observations sont obligatoires pour cette action</span>
                    </label>
                  )}
                </div>

                <div className="modal-action">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowActionModal(false);
                      setObservations('');
                      setSelectedOctroi(null);
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={`btn ${actionType === 'validate' ? 'btn-success' :
                        actionType === 'reject' ? 'btn-error' : 'btn-info'
                      }`}
                  >
                    {actionType === 'instance' && '📋 Mettre en instance'}
                    {actionType === 'validate' && '✓ Confirmer la validation'}
                    {actionType === 'reject' && '✗ Confirmer le rejet'}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Modal d'historique des observations */}
        {showHistoryModal && selectedOctroiHistory && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                Historique des observations - {selectedOctroiHistory.numero}
              </h3>

              <div className="space-y-4">
                {selectedOctroiHistory.historiqueActions && selectedOctroiHistory.historiqueActions.length > 0 ? (
                  selectedOctroiHistory.historiqueActions.map((action) => (
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

                {selectedOctroiHistory.observations && (
                  <div className="card bg-warning/10 border border-warning">
                    <div className="card-body p-4">
                      <h4 className="font-semibold text-sm mb-2">📝 Observations actuelles</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedOctroiHistory.observations}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  className="btn"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedOctroiHistory(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Modal des documents */}
        {showDocumentsModal && selectedOctroiDocuments && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                📎 Documents - {selectedOctroiDocuments.numero}
              </h3>

              <div className="space-y-3">
                {selectedOctroiDocuments.documents && selectedOctroiDocuments.documents.length > 0 ? (
                  selectedOctroiDocuments.documents.map((doc) => (
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
                    setSelectedOctroiDocuments(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Modal de l'état du stock */}
        {showStockModal && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-5xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                État détaillé du stock en temps réel
              </h3>

              <div className="alert alert-info mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <div className="font-semibold">Légende</div>
                  <div className="text-sm">
                    <p><strong>Stock de départ :</strong> Quantité actuelle en base de données</p>
                    <p><strong>Quantités en attente :</strong> Somme des octrois non encore validés par l'Ordonnateur</p>
                    <p><strong>Stock final théorique :</strong> Stock réellement disponible après déduction des quantités en attente</p>
                  </div>
                </div>
              </div>

              {allProduits.length > 0 ? (
                <div className="overflow-x-auto bg-base-100 rounded-lg border border-base-300">
                  <table className="table">
                    <thead>
                      <tr className="bg-primary text-primary-content">
                        <th className="text-sm font-semibold">Produit</th>
                        <th className="text-sm font-semibold">Structure</th>
                        <th className="text-sm font-semibold text-right">Stock de départ</th>
                        <th className="text-sm font-semibold text-right">Quantités en attente</th>
                        <th className="text-sm font-semibold text-right">Stock final théorique</th>
                        <th className="text-sm font-semibold text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getStockDetails().map(({ produit, stockDepart, quantiteEnAttente, stockTheorique }) => (
                        <tr key={produit.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                          <td>
                            <div className="font-semibold">{produit.name}</div>
                            <div className="text-xs text-gray-500">Unité: {produit.unit}</div>
                          </td>
                          <td>
                            <div className="text-sm">{produit.structure?.name || 'N/A'}</div>
                          </td>
                          <td className="text-right">
                            <span className="font-medium text-gray-900">
                              {stockDepart} {produit.unit}
                            </span>
                          </td>
                          <td className="text-right">
                            <span className={`font-medium ${quantiteEnAttente > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                              -{quantiteEnAttente} {produit.unit}
                            </span>
                          </td>
                          <td className="text-right">
                            <span className={`font-bold text-lg ${stockTheorique > stockDepart * 0.2 ? 'text-green-600' :
                                stockTheorique > 0 ? 'text-orange-600' :
                                  'text-red-600'
                              }`}>
                              {stockTheorique} {produit.unit}
                            </span>
                          </td>
                          <td className="text-center">
                            {stockTheorique > stockDepart * 0.2 ? (
                              <div className="badge badge-success gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Disponible
                              </div>
                            ) : stockTheorique > 0 ? (
                              <div className="badge badge-warning gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Faible
                              </div>
                            ) : (
                              <div className="badge badge-error gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Épuisé
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <span>Aucun produit disponible dans le système</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowStockModal(false)}
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

export default OctroisPage;
