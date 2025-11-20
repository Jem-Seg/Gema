"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  Shield, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  MoreVertical,
  Users
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  requiresStructure: boolean;
  _count?: {
    users: number;
  };
}

export default function RolesPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requiresStructure: false
  });

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/roles');
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin/verify');
          return;
        }
        throw new Error('Erreur chargement rôles');
      }

      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated' && !user) {
      router.push('/sign-in');
      return;
    }

    if (status === 'authenticated' && user) {
      loadRoles();
    }
  }, [status === 'authenticated', user, router, loadRoles]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      requiresStructure: false
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description,
      requiresStructure: role.requiresStructure
    });
    setEditingId(role.id);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/admin/roles/${editingId}` : '/api/admin/roles';
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
        await loadRoles();
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        await loadRoles();
        alert(data.message || 'Rôle supprimé');
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Rôles</h1>
              <div className="badge badge-primary">
                {roles.length} rôle{roles.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouveau Rôle</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </div>

        {(showCreateForm || editingId) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">
                  {editingId ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
                </h2>
                <button
                  onClick={resetForm}
                  className="btn btn-ghost btn-sm"
                  title="Fermer le formulaire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Nom du rôle *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Administrateur, Utilisateur standard..."
                      title="Saisir le nom du rôle"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="label cursor-pointer bg-base-200 rounded-lg p-3 hover:bg-base-300 transition-colors">
                      <span className="label-text font-medium">Nécessite une structure</span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={formData.requiresStructure}
                        onChange={(e) => setFormData({...formData, requiresStructure: e.target.checked})}
                      />
                    </label>
                    <div className="text-xs sm:text-sm text-base-content/70 mt-2 px-3">
                      Si activé, les utilisateurs devront être assignés à une structure
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">Description *</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    placeholder="Décrivez les permissions et responsabilités de ce rôle..."
                    title="Saisir la description du rôle"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t border-base-200">
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
          {roles.map((role) => (
            <div key={role.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20">
              <div className="card-body p-4 sm:p-6">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="card-title flex items-center gap-2 text-base sm:text-lg font-semibold leading-tight mb-2">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <span className="truncate" title={role.name}>{role.name}</span>
                    </h3>
                    {role.requiresStructure && (
                      <div className="badge badge-info badge-sm mb-2">
                        Nécessite une structure
                      </div>
                    )}
                  </div>
                  
                  {/* Actions mobiles directes */}
                  <div className="flex gap-1 sm:hidden">
                    <button
                      onClick={() => handleEdit(role)}
                      className="btn btn-ghost btn-xs text-primary hover:bg-primary/10"
                      title="Modifier"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Menu dropdown desktop */}
                  <div className="dropdown dropdown-end shrink-0 hidden sm:block">
                    <button tabIndex={0} className="btn btn-ghost btn-sm hover:bg-base-200" title="Options de gestion">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10 border border-base-200">
                      <li>
                        <button onClick={() => handleEdit(role)} className="text-sm">
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                      </li>
                      <li>
                        <button onClick={() => handleDelete(role.id)} className="text-error text-sm">
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm sm:text-base text-base-content/70 leading-relaxed line-clamp-3" title={role.description}>
                    {role.description}
                  </p>
                </div>

                {role._count && (
                  <div className="flex gap-2 pt-4 border-t border-base-200">
                    <div className="badge badge-success badge-sm">
                      <Users className="w-3 h-3 mr-1" />
                      {role._count.users} utilisateur{role._count.users > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {roles.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-base-content/30 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Aucun rôle défini</h2>
            <p className="text-sm sm:text-base text-base-content/70 mb-6 max-w-md mx-auto">
              Créez des rôles pour organiser les permissions et accès des utilisateurs de votre système.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary btn-sm sm:btn-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer le premier rôle
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}