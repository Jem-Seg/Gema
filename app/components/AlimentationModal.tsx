"use client"

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

interface Produit {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  structureId: string;
  structure?: {
    name: string;
  };
}

interface Alimentation {
  id: string;
  numero: string;
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  fournisseurNom: string;
  fournisseurNIF: string | null;
  statut: string;
  isLocked: boolean;
  produit: {
    id: string;
    name: string;
    unit: string;
  };
  documents?: Array<{
    id: string;
    type: string;
    nom: string;
    url: string;
  }>;
}

interface AlimentationModalProps {
  mode?: 'create' | 'edit';
  alimentation?: Alimentation | null;
  onSuccess?: () => void;
}

interface DocumentUpload {
  id: string;
  file: File;
  type: 'FACTURE' | 'PV_RECEPTION' | 'AUTRE';
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

const AlimentationModal: React.FC<AlimentationModalProps> = ({ mode = 'create', alimentation, onSuccess }) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);

  // États du formulaire
  const [produitId, setProduitId] = useState('');
  const [quantite, setQuantite] = useState<number>(0);
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [fournisseurNom, setFournisseurNom] = useState('');
  const [fournisseurNIF, setFournisseurNIF] = useState('');

  // Documents à uploader
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  
  // Documents existants à supprimer
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);

  // Produit sélectionné
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);

  // Clé pour forcer la réinitialisation des inputs de fichiers
  const [formKey, setFormKey] = useState(0);

  // Charger les données initiales en mode édition
  useEffect(() => {
    if (mode === 'edit' && alimentation) {
      setProduitId(alimentation.produitId);
      setQuantite(alimentation.quantite);
      setPrixUnitaire(alimentation.prixUnitaire);
      setFournisseurNom(alimentation.fournisseurNom);
      setFournisseurNIF(alimentation.fournisseurNIF || '');
      setSelectedProduit({
        id: alimentation.produit.id,
        name: alimentation.produit.name,
        unit: alimentation.produit.unit,
        quantity: 0,
        structureId: ''
      });
    }
  }, [mode, alimentation]);

  // Charger les produits du ministère de l'utilisateur
  useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadProduits = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/produits');
        const result = await response.json();

        if (result.success) {
          setProduits(result.data || []);
        } else {
          toast.error('Erreur lors du chargement des produits');
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    loadProduits();
  }, [status === 'authenticated', user]);

  // Gérer la sélection d'un produit
  const handleProduitChange = (id: string) => {
    setProduitId(id);
    const produit = produits.find(p => p.id === id);
    setSelectedProduit(produit || null);
  };

  // Ajouter un document
  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>, type: 'FACTURE' | 'PV_RECEPTION' | 'AUTRE') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: DocumentUpload[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type,
      uploading: false,
      uploaded: false,
    }));

    setDocuments(prev => [...prev, ...newDocs]);
  };

  // Supprimer un nouveau document (pas encore uploadé)
  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Marquer un document existant pour suppression
  const handleDeleteExistingDocument = async (docId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce document ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/alimentations/documents/${docId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Document supprimé');
        // Ajouter à la liste des documents à supprimer pour mise à jour de l'UI
        setDocumentsToDelete(prev => [...prev, docId]);
      } else {
        toast.error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  };

  // Obtenir l'icône selon le type de document
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'FACTURE': return '📄';
      case 'PV_RECEPTION': return '📋';
      case 'AUTRE': return '📎';
      default: return '📄';
    }
  };

  // Obtenir le libellé selon le type de document
  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'FACTURE': return 'Facture';
      case 'PV_RECEPTION': return 'PV de réception';
      case 'AUTRE': return 'Autre document';
      default: return type;
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantite || !prixUnitaire || !fournisseurNom) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (quantite <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }

    if (prixUnitaire <= 0) {
      toast.error('Le prix unitaire doit être supérieur à 0');
      return;
    }

    if (mode === 'create' && !produitId) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'edit' && alimentation) {
        // Modifier l'alimentation existante
        const response = await fetch(`/api/alimentations/${alimentation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantite,
            prixUnitaire,
            fournisseurNom,
            fournisseurNIF: fournisseurNIF || undefined
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Uploader les nouveaux documents si présents
          if (documents.length > 0) {
            toast.info('Upload des documents en cours...');
            
            for (const doc of documents) {
              try {
                const formData = new FormData();
                formData.append('file', doc.file);
                formData.append('alimentationId', alimentation.id);
                formData.append('type', doc.type);
                formData.append('userId', (user as any)?.id || '');

                const uploadResponse = await fetch('/api/alimentations/documents/upload', {
                  method: 'POST',
                  body: formData,
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResult.success) {
                  console.error('Erreur upload:', uploadResult.message);
                }
              } catch (error) {
                console.error('Erreur upload document:', error);
              }
            }
          }

          toast.success('Alimentation modifiée avec succès !');
          resetForm();
          (document.getElementById('modal_modifier_alimentation') as HTMLDialogElement)?.close();
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.message || 'Erreur lors de la modification');
        }
      } else {
        // Créer une nouvelle alimentation
        const response = await fetch('/api/alimentations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            produitId,
            quantite,
            prixUnitaire,
            fournisseurNom,
            fournisseurNIF: fournisseurNIF || undefined
          }),
        });

        const result = await response.json();

        if (result.success) {
          const alimentationId = result.data.id;

          // Uploader les documents si présents
          if (documents.length > 0) {
            toast.info('Upload des documents en cours...');
            
            for (const doc of documents) {
              try {
                const formData = new FormData();
                formData.append('file', doc.file);
                formData.append('alimentationId', alimentationId);
                formData.append('type', doc.type);
                formData.append('userId', (user as any)?.id || '');

                const uploadResponse = await fetch('/api/alimentations/documents/upload', {
                  method: 'POST',
                  body: formData,
                });

                const uploadResult = await uploadResponse.json();
                if (!uploadResult.success) {
                  console.error('Erreur upload:', uploadResult.message);
                }
              } catch (error) {
                console.error('Erreur upload document:', error);
              }
            }
          }

          toast.success('Alimentation créée avec succès !');
          resetForm();
          (document.getElementById('modal_nouvelle_alimentation') as HTMLDialogElement)?.close();
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.message || 'Erreur lors de la création');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(`Erreur lors de ${mode === 'edit' ? 'la modification' : 'la création'} de l\'alimentation`);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setProduitId('');
    setQuantite(0);
    setPrixUnitaire(0);
    setFournisseurNom('');
    setFournisseurNIF('');
    setSelectedProduit(null);
    setDocuments([]);
    setDocumentsToDelete([]);
    setFormKey(prev => prev + 1); // Forcer la réinitialisation des inputs de fichiers
  };

  // Fermer le modal
  const closeModal = () => {
    resetForm();
    (document.getElementById('modal_nouvelle_alimentation') as HTMLDialogElement)?.close();
  };

  if (status !== 'authenticated' || !user) {
    return null;
  }

  const modalId = mode === 'edit' ? 'modal_modifier_alimentation' : 'modal_nouvelle_alimentation';
  const modalTitle = mode === 'edit' ? '✏️ Modifier l\'Alimentation' : '📝 Nouvelle Alimentation';

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box max-w-2xl">
        <form method="dialog">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={closeModal}
          >
            ✕
          </button>
        </form>

        <h3 className="font-bold text-lg mb-6">{modalTitle}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection du produit - désactivé en mode édition */}
          {mode === 'edit' ? (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Produit</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-base-200"
                value={selectedProduit?.name || ''}
                disabled
                readOnly
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">Le produit ne peut pas être modifié</span>
              </label>
            </div>
          ) : (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Produit *</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={produitId}
                onChange={(e) => handleProduitChange(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Sélectionner un produit...</option>
                {produits.map((produit) => (
                  <option key={produit.id} value={produit.id}>
                    {produit.name} - Stock actuel: {produit.quantity} {produit.unit}
                    {produit.structure?.name && ` (${produit.structure.name})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Détails du produit sélectionné */}
          {selectedProduit && (
            <div className="alert alert-info">
              <div>
                <div className="font-semibold">Produit sélectionné</div>
                <div className="text-sm">
                  {selectedProduit.name} - Stock actuel: {selectedProduit.quantity} {selectedProduit.unit}
                  {selectedProduit.structure?.name && (
                    <> ({selectedProduit.structure.name})</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quantité */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Quantité *</span>
              {selectedProduit && (
                <span className="label-text-alt text-xs">
                  Unité: {selectedProduit.unit}
                </span>
              )}
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={quantite || ''}
              onChange={(e) => setQuantite(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              required
              disabled={loading}
              placeholder="Quantité à ajouter"
            />
          </div>

          {/* Prix unitaire */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Prix unitaire (MRU) *</span>
              {quantite > 0 && prixUnitaire > 0 && (
                <span className="label-text-alt font-semibold text-primary">
                  Total: {(quantite * prixUnitaire).toLocaleString('fr-FR')} MRU
                </span>
              )}
            </label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={prixUnitaire || ''}
              onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              required
              disabled={loading}
              placeholder="Prix par unité"
            />
          </div>

          {/* Fournisseur */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Nom du fournisseur *</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={fournisseurNom}
              onChange={(e) => setFournisseurNom(e.target.value)}
              required
              disabled={loading}
              placeholder="Nom du fournisseur"
            />
          </div>

          {/* NIF du fournisseur (optionnel) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">NIF du fournisseur</span>
              <span className="label-text-alt text-xs">(Optionnel)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={fournisseurNIF}
              onChange={(e) => setFournisseurNIF(e.target.value)}
              disabled={loading}
              placeholder="Numéro d'identification fiscale"
            />
          </div>

          {/* Section Documents */}
          <div className="divider">📎 Documents justificatifs</div>

          {/* Documents existants en mode édition */}
          {mode === 'edit' && alimentation?.documents && alimentation.documents.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Documents existants ({alimentation.documents.filter(d => !documentsToDelete.includes(d.id)).length})
                </span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-base-200 p-3 rounded-lg">
                {alimentation.documents
                  .filter(doc => !documentsToDelete.includes(doc.id))
                  .map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-base-100 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">
                        {doc.type === 'FACTURE' && '📄'}
                        {doc.type === 'PV_RECEPTION' && '📋'}
                        {doc.type === 'AUTRE' && '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{doc.nom}</div>
                        <div className="text-xs text-gray-500">
                          {doc.type === 'FACTURE' && 'Facture'}
                          {doc.type === 'PV_RECEPTION' && 'PV de réception'}
                          {doc.type === 'AUTRE' && 'Autre document'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm btn-circle tooltip"
                        data-tip="Voir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-circle text-error tooltip"
                        onClick={() => handleDeleteExistingDocument(doc.id)}
                        disabled={loading}
                        data-tip="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Facture */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">📄 Facture fournisseur</span>
              <span className="label-text-alt text-xs">
                {mode === 'edit' ? '(Ajouter de nouveaux documents)' : '(Optionnel)'}
              </span>
            </label>
            <input
              key={`facture-${formKey}`}
              type="file"
              className="file-input file-input-bordered w-full"
              onChange={(e) => handleAddDocument(e, 'FACTURE')}
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              multiple
              disabled={loading}
            />
          </div>

          {/* Upload PV de réception */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">📋 PV de réception</span>
              <span className="label-text-alt text-xs">
                {mode === 'edit' ? '(Ajouter de nouveaux documents)' : '(Optionnel)'}
              </span>
            </label>
            <input
              key={`pv-${formKey}`}
              type="file"
              className="file-input file-input-bordered w-full"
              onChange={(e) => handleAddDocument(e, 'PV_RECEPTION')}
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              multiple
              disabled={loading}
            />
          </div>

          {/* Upload Autres documents */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">📎 Autres documents</span>
              <span className="label-text-alt text-xs">
                {mode === 'edit' ? '(Ajouter de nouveaux documents)' : '(Optionnel)'}
              </span>
            </label>
            <input
              key={`autre-${formKey}`}
              type="file"
              className="file-input file-input-bordered w-full"
              onChange={(e) => handleAddDocument(e, 'AUTRE')}
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              multiple
              disabled={loading}
            />
          </div>

          {/* Liste des documents à uploader */}
          {documents.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  {mode === 'edit' ? 'Nouveaux documents à ajouter' : 'Documents sélectionnés'} ({documents.length})
                </span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">{getDocumentIcon(doc.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{doc.file.name}</div>
                        <div className="text-xs text-gray-500">
                          {getDocumentLabel(doc.type)} - {(doc.file.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-circle"
                      onClick={() => handleRemoveDocument(doc.id)}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closeModal}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {mode === 'edit' ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? '✓ Modifier l\'alimentation' : '✓ Créer l\'alimentation'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default AlimentationModal;
