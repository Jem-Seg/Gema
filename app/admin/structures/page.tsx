"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  Building, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  MoreVertical,
  Users,
  BarChart3
} from 'lucide-react';

interface Structure {
  id: string;
  name: string;
  description?: string;
  abreviation?: string;
  ministereId: string;
  ministere: {
    name: string;
    abreviation: string;
  };
  _count?: {
    users: number;
  };
}

interface Ministere {
  id: string;
  name: string;
  abreviation: string;
}

export default function StructuresPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedMinistereId = searchParams.get('ministere');
  
  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [ministeres, setMinisteres] = useState<Ministere[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    abreviation: '',
    ministereId: selectedMinistereId || ''
  });

  const loadData = useCallback(async () => {
    try {
      const [structuresResponse, ministeresResponse] = await Promise.all([
        fetch('/api/admin/structures'),
        fetch('/api/admin/ministeres')
      ]);
      
      if (!structuresResponse.ok || !ministeresResponse.ok) {
        if (structuresResponse.status === 403 || ministeresResponse.status === 403) {
          router.push('/admin/verify');
          return;
        }
        throw new Error('Erreur chargement données');
      }

      const structuresData = await structuresResponse.json();
      const ministeresData = await ministeresResponse.json();
      
      setStructures(structuresData.structures || []);
      setMinisteres(ministeresData.ministeres || []);
      
      // Si un ministère est sélectionné, préremplir le formulaire
      if (selectedMinistereId) {
        setFormData(prev => ({ ...prev, ministereId: selectedMinistereId }));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }, [router, selectedMinistereId]);

  useEffect(() => {
    const initializePage = async () => {
      if (status === 'authenticated' && !user) {
        router.push('/sign-in');
        return;
      }

      if (status === 'authenticated' && user) {
        await loadData();
      }
    };

    initializePage();
  }, [status === 'authenticated', user, router, loadData]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      abreviation: '',
      ministereId: selectedMinistereId || ''
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleEdit = (structure: Structure) => {
    setFormData({
      name: structure.name,
      description: structure.description || '',
      abreviation: structure.abreviation || '',
      ministereId: structure.ministereId
    });
    setEditingId(structure.id);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/admin/structures/${editingId}` : '/api/admin/structures';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await loadData();
        resetForm();
        alert(data.message || 'Opération réussie');
      } else {
        alert(data.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette structure ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/structures/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadData();
        alert(data.message || 'Structure supprimée');
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  // Filtrer les structures selon le ministère sélectionné
  const filteredStructures = selectedMinistereId 
    ? structures.filter(s => s.ministereId === selectedMinistereId)
    : structures;

  const selectedMinistere = ministeres.find(m => m.id === selectedMinistereId);

  if (status !== 'authenticated' || loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="btn btn-ghost btn-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Retour au tableau de bord</span>
              <span className="sm:hidden">Retour</span>
            </button>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Structures</h1>
                <div className="badge badge-primary">
                  {filteredStructures.length} structure(s)
                </div>
              </div>
              {selectedMinistere && (
                <div className="text-sm sm:text-base text-base-content/70">
                  Ministère : {selectedMinistere.name}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle Structure</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        </div>

        {/* Filtre par ministère - Vue desktop */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          <button
            onClick={() => router.push('/admin/structures')}
            className={`btn btn-sm ${!selectedMinistereId ? 'btn-primary' : 'btn-outline'}`}
          >
            Tous les ministères
          </button>
          {ministeres.map(ministere => (
            <button
              key={ministere.id}
              onClick={() => router.push(`/admin/structures?ministere=${ministere.id}`)}
              className={`btn btn-sm ${selectedMinistereId === ministere.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {ministere.abreviation}
            </button>
          ))}
        </div>

        {/* Filtre par ministère - Vue mobile */}
        <div className="sm:hidden">
          <select
            className="select select-bordered w-full"
            value={selectedMinistereId || ''}
            onChange={(e) => {
              if (e.target.value) {
                router.push(`/admin/structures?ministere=${e.target.value}`);
              } else {
                router.push('/admin/structures');
              }
            }}
            title="Filtrer par ministère"
          >
            <option value="">Tous les ministères</option>
            {ministeres.map(ministere => (
              <option key={ministere.id} value={ministere.id}>
                {ministere.name}
              </option>
            ))}
          </select>
        </div>

        {(showCreateForm || editingId) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">
                  {editingId ? 'Modifier la structure' : 'Créer une nouvelle structure'}
                </h2>
                <button
                  onClick={resetForm}
                  className="btn btn-ghost btn-sm"
                  title="Fermer le formulaire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Nom de la structure *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Direction, Service, Bureau..."
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Abréviation</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.abreviation}
                      onChange={(e) => setFormData({...formData, abreviation: e.target.value.toUpperCase()})}
                      placeholder="DRH, DSI, DAF..."
                      maxLength={10}
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Utilisé dans les références d'octrois</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Ministère *</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.ministereId}
                      onChange={(e) => setFormData({...formData, ministereId: e.target.value})}
                      required
                      title="Sélectionner un ministère"
                    >
                      <option value="">Choisir un ministère</option>
                      {ministeres.map(ministere => (
                        <option key={ministere.id} value={ministere.id}>
                          {ministere.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description détaillée des missions et responsabilités"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button type="button" onClick={resetForm} className="btn btn-ghost w-full sm:w-auto">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredStructures.map((structure) => (
            <div key={structure.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
              <div className="card-body p-4 sm:p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="card-title text-base sm:text-lg font-semibold leading-tight mb-2" title={structure.name}>
                      {structure.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-primary shrink-0" />
                      <div className="badge badge-outline badge-sm sm:badge-md text-xs sm:text-sm" title={structure.ministere.name}>
                        {structure.ministere.abreviation}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions responsives */}
                  <div className="flex gap-1 sm:hidden">
                    <button
                      onClick={() => router.push(`/admin/structures/${structure.id}/statistics`)}
                      className="btn btn-ghost btn-xs text-info hover:bg-info/10"
                      title="Statistiques"
                    >
                      <BarChart3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleEdit(structure)}
                      className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                      title="Modifier"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(structure.id)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Dropdown desktop */}
                  <div className="dropdown dropdown-end shrink-0 hidden sm:block">
                    <button tabIndex={0} className="btn btn-ghost btn-sm hover:bg-base-200" title="Options de gestion">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10 border border-base-200">
                      <li>
                        <button 
                          onClick={() => router.push(`/admin/structures/${structure.id}/statistics`)}
                          className="text-sm"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Statistiques
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleEdit(structure)} className="text-sm">
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleDelete(structure.id)} className="text-error text-sm">
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {structure.abreviation && (
                  <div className="mb-3">
                    <span className="badge badge-info badge-sm">
                      {structure.abreviation}
                    </span>
                  </div>
                )}

                {structure.description && (
                  <div className="mb-4">
                    <p className="text-sm sm:text-base text-base-content/70 leading-relaxed line-clamp-3" title={structure.description}>
                      {structure.description}
                    </p>
                  </div>
                )}

                {structure._count && (
                  <div className="flex gap-2 pt-2 border-t border-base-200">
                    <div className="badge badge-success badge-sm">
                      <Users className="w-3 h-3 mr-1" />
                      {structure._count.users} utilisateur{structure._count.users > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStructures.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {selectedMinistere 
                ? `Aucune structure pour ${selectedMinistere.name}`
                : 'Aucune structure'
              }
            </h2>
            <p className="text-base-content/70 mb-4">
              {selectedMinistere 
                ? 'Créez la première structure pour ce ministère.'
                : 'Commencez par créer votre première structure.'
              }
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une structure
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}