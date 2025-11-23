"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  UserCheck,
  UserX,
  Shield
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  isAdmin: boolean;
  isApproved: boolean;
  clerkId?: string;
  createdAt: string;
  role?: {
    id: string;
    name: string;
  };
  ministere?: {
    id: string;
    name: string;
    abreviation: string;
  };
  structure?: {
    id: string;
    name: string;
  };
}

interface Ministere {
  id: string;
  name: string;
  abreviation: string;
  structures: Structure[];
}

interface Structure {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  requiresStructure: boolean;
}

interface UsersData {
  users: User[];
  ministeres: Ministere[];
  roles: Role[];
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsersData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [roleAssignmentUser, setRoleAssignmentUser] = useState<User | null>(null);
  const [roleAssignmentData, setRoleAssignmentData] = useState({
    roleId: '',
    ministereId: '',
    structureId: ''
  });
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    name: '',
    roleId: '',
    ministereId: '',
    structureId: '',
    isAdmin: false,
    isApproved: true
  });

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin/verify');
          return;
        }
        throw new Error('Erreur chargement données');
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      email: '',
      firstName: '',
      name: '',
      roleId: '',
      ministereId: '',
      structureId: '',
      isAdmin: false,
      isApproved: true
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleEdit = (userToEdit: User) => {
    setFormData({
      email: userToEdit.email,
      firstName: userToEdit.firstName,
      name: userToEdit.name,
      roleId: userToEdit.role?.id || '',
      ministereId: userToEdit.ministere?.id || '',
      structureId: userToEdit.structure?.id || '',
      isAdmin: userToEdit.isAdmin,
      isApproved: userToEdit.isApproved
    });
    setEditingId(userToEdit.id);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        await loadData();
        resetForm();
        alert(result.message || 'Opération réussie');
      } else {
        alert(result.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    setProcessingUser(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        await loadData();
        alert(result.message || 'Utilisateur supprimé');
      } else {
        alert(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setProcessingUser(null);
    }
  };

  const toggleUserStatus = async (userId: string, field: 'isApproved' | 'isAdmin') => {
    setProcessingUser(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field }),
      });

      const result = await response.json();

      if (response.ok) {
        await loadData();
        alert(result.message);
      } else {
        alert(result.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setProcessingUser(null);
    }
  };

  const openRoleAssignment = (userToUpdate: User) => {
    setRoleAssignmentUser(userToUpdate);
    setRoleAssignmentData({
      roleId: userToUpdate.role?.id || '',
      ministereId: userToUpdate.ministere?.id || '',
      structureId: userToUpdate.structure?.id || ''
    });
  };

  const closeRoleAssignment = () => {
    setRoleAssignmentUser(null);
    setRoleAssignmentData({
      roleId: '',
      ministereId: '',
      structureId: ''
    });
  };

  const handleRoleAssignment = async () => {
    if (!roleAssignmentUser) return;

    setProcessingUser(roleAssignmentUser.id);

    try {
      const payload = {
        roleId: roleAssignmentData.roleId || null,
        ministereId: roleAssignmentData.ministereId || null,
        structureId: roleAssignmentData.structureId || null
      };

      console.log('Attribution rôle - Payload:', payload);

      const response = await fetch(`/api/admin/users/${roleAssignmentUser.id}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        await loadData();
        closeRoleAssignment();
        alert(result.message || 'Rôle attribué avec succès');
      } else {
        console.error('Erreur API:', result);
        alert(result.error || 'Erreur lors de l\'attribution');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setProcessingUser(null);
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

  if (!data) {
    return (
      <Wrapper>
        <div className="alert alert-error">
          <span>Erreur lors du chargement des données</span>
        </div>
      </Wrapper>
    );
  }

  const selectedRole = data.roles.find(r => r.id === formData.roleId);
  const selectedMinistere = data.ministeres.find(m => m.id === formData.ministereId);
  
  const assignmentRole = data.roles.find(r => r.id === roleAssignmentData.roleId);
  const assignmentMinistere = data.ministeres.find(m => m.id === roleAssignmentData.ministereId);

  return (
    <Wrapper>
      <div className="space-y-6">\n        {/* Modal d'attribution de rôle */}
        {roleAssignmentUser && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                Attribuer un rôle à {roleAssignmentUser.firstName} {roleAssignmentUser.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Rôle</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={roleAssignmentData.roleId}
                    onChange={(e) => setRoleAssignmentData({
                      ...roleAssignmentData,
                      roleId: e.target.value,
                      structureId: ''
                    })}
                    title="Sélectionner un rôle"
                  >
                    <option value="">Aucun rôle</option>
                    {data.roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Ministère</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={roleAssignmentData.ministereId}
                    onChange={(e) => setRoleAssignmentData({
                      ...roleAssignmentData,
                      ministereId: e.target.value,
                      structureId: ''
                    })}
                    title="Sélectionner un ministère"
                  >
                    <option value="">Aucun ministère</option>
                    {data.ministeres.map(ministere => (
                      <option key={ministere.id} value={ministere.id}>
                        {ministere.name}
                      </option>
                    ))}
                  </select>
                </div>

                {assignmentRole?.requiresStructure && assignmentMinistere && (
                  <div>
                    <label className="label">
                      <span className="label-text">Structure *</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={roleAssignmentData.structureId}
                      onChange={(e) => setRoleAssignmentData({
                        ...roleAssignmentData,
                        structureId: e.target.value
                      })}
                      title="Sélectionner une structure"
                    >
                      <option value="">Choisir une structure</option>
                      {assignmentMinistere.structures.map(structure => (
                        <option key={structure.id} value={structure.id}>
                          {structure.name}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-base-content/60 mt-1">
                      Ce rôle nécessite l&apos;assignation à une structure
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  onClick={closeRoleAssignment}
                  className="btn btn-ghost"
                  disabled={processingUser === roleAssignmentUser.id}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRoleAssignment}
                  className="btn btn-primary"
                  disabled={
                    processingUser === roleAssignmentUser.id ||
                    (assignmentRole?.requiresStructure && !roleAssignmentData.structureId)
                  }
                >
                  {processingUser === roleAssignmentUser.id ? 'Attribution...' : 'Attribuer'}
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={closeRoleAssignment}></div>
          </div>
        )}

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
              <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Utilisateurs</h1>
              <div className="badge badge-info">
                {data.users.length} utilisateur(s)
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouvel Utilisateur</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </div>

        {(showCreateForm || editingId) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">
                  {editingId ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
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
                  <div className="lg:col-span-2 sm:col-span-1">
                    <label className="label">
                      <span className="label-text">Email *</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={!!editingId}
                      placeholder="exemple@email.com"
                    />
                    {editingId && (
                      <div className="text-xs text-base-content/60 mt-1">
                        L&apos;email ne peut pas être modifié
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Prénom *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Nom *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Nom"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Rôle</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.roleId}
                      onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                      title="Sélectionner un rôle"
                    >
                      <option value="">Aucun rôle</option>
                      {data.roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Ministère</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={formData.ministereId}
                      onChange={(e) => {
                        setFormData({
                          ...formData, 
                          ministereId: e.target.value,
                          structureId: ''
                        });
                      }}
                      title="Sélectionner un ministère"
                    >
                      <option value="">Aucun ministère</option>
                      {data.ministeres.map(ministere => (
                        <option key={ministere.id} value={ministere.id}>
                          {ministere.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedRole?.requiresStructure && selectedMinistere && (
                    <div className="lg:col-span-2">
                      <label className="label">
                        <span className="label-text">Structure *</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={formData.structureId}
                        onChange={(e) => setFormData({...formData, structureId: e.target.value})}
                        required={selectedRole.requiresStructure}
                        title="Sélectionner une structure"
                      >
                        <option value="">Choisir une structure</option>
                        {selectedMinistere.structures.map(structure => (
                          <option key={structure.id} value={structure.id}>
                            {structure.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-base-content/60 mt-1">
                        Ce rôle nécessite l&apos;assignation à une structure
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.isApproved}
                      onChange={(e) => setFormData({...formData, isApproved: e.target.checked})}
                    />
                    <span className="label-text ml-2">Utilisateur approuvé</span>
                  </label>

                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                    />
                    <span className="label-text ml-2">Administrateur</span>
                  </label>
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

        {/* Vue desktop - tableau */}
        <div className="hidden lg:block overflow-x-auto bg-base-100 shadow-xl rounded-lg border border-base-300">
          <table className="table w-full">
            <thead>
              <tr className="bg-primary text-primary-content">
                <th className="text-sm font-semibold">Utilisateur</th>
                <th className="text-sm font-semibold">Email</th>
                <th className="text-sm font-semibold">Rôle</th>
                <th className="text-sm font-semibold">Ministère</th>
                <th className="text-sm font-semibold">Structure</th>
                <th className="text-sm font-semibold">Statut</th>
                <th className="text-sm font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((userData) => (
                <tr key={userData.id} className="hover:bg-base-200 transition-colors border-b border-base-300">
                  <td>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold">{userData.firstName} {userData.name}</div>
                        <div className="text-sm opacity-50">
                          Créé le {new Date(userData.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs truncate">{userData.email}</td>
                  <td>
                    {userData.role ? (
                      <div className="badge badge-outline">{userData.role.name}</div>
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </td>
                  <td>
                    {userData.ministere ? (
                      <div className="badge badge-info">{userData.ministere.abreviation}</div>
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </td>
                  <td>
                    {userData.structure ? (
                      <div className="badge badge-secondary badge-sm">{userData.structure.name}</div>
                    ) : (
                      <span className="text-gray-400">Aucune</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {userData.isAdmin && (
                        <div className="badge badge-primary badge-sm">Admin</div>
                      )}
                      {userData.isApproved ? (
                        <div className="badge badge-success badge-sm">Approuvé</div>
                      ) : (
                        <div className="badge badge-warning badge-sm">En attente</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openRoleAssignment(userData)}
                        className="btn btn-ghost btn-xs"
                        disabled={processingUser === userData.id}
                        title="Attribuer un rôle"
                      >
                        <Users className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(userData)}
                        className="btn btn-ghost btn-xs"
                        disabled={processingUser === userData.id}
                        title="Modifier"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => toggleUserStatus(userData.id, 'isApproved')}
                        className={`btn btn-xs ${userData.isApproved ? 'btn-warning' : 'btn-success'}`}
                        disabled={processingUser === userData.id}
                        title={userData.isApproved ? 'Désapprouver' : 'Approuver'}
                      >
                        {userData.isApproved ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => toggleUserStatus(userData.id, 'isAdmin')}
                        className={`btn btn-xs ${userData.isAdmin ? 'btn-error' : 'btn-info'}`}
                        disabled={processingUser === userData.id}
                        title={userData.isAdmin ? 'Retirer admin' : 'Promouvoir admin'}
                      >
                        <Shield className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDelete(userData.id)}
                        className="btn btn-error btn-xs"
                        disabled={processingUser === userData.id}
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vue mobile/tablette - cartes */}
        <div className="lg:hidden grid gap-4">
          {data.users.map((userData) => (
            <div key={userData.id} className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{userData.firstName} {userData.name}</h3>
                    <p className="text-sm text-base-content/70 break-all">{userData.email}</p>
                    <p className="text-xs text-base-content/50 mt-1">
                      Créé le {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="dropdown dropdown-end">
                    <button 
                      tabIndex={0} 
                      className="btn btn-ghost btn-sm"
                      title="Actions"
                      disabled={processingUser === userData.id}
                    >
                      ⋯
                    </button>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
                      <li>
                        <button 
                          onClick={() => openRoleAssignment(userData)}
                          disabled={processingUser === userData.id}
                        >
                          <Users className="w-4 h-4" />
                          Attribuer un rôle
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleEdit(userData)}
                          disabled={processingUser === userData.id}
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => toggleUserStatus(userData.id, 'isApproved')}
                          disabled={processingUser === userData.id}
                          className={userData.isApproved ? 'text-warning' : 'text-success'}
                        >
                          {userData.isApproved ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          {userData.isApproved ? 'Désapprouver' : 'Approuver'}
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => toggleUserStatus(userData.id, 'isAdmin')}
                          disabled={processingUser === userData.id}
                          className={userData.isAdmin ? 'text-error' : 'text-info'}
                        >
                          <Shield className="w-4 h-4" />
                          {userData.isAdmin ? 'Retirer admin' : 'Promouvoir admin'}
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => handleDelete(userData.id)}
                          disabled={processingUser === userData.id}
                          className="text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-xs font-medium text-base-content/60">RÔLE</span>
                    <div className="mt-1">
                      {userData.role ? (
                        <div className="badge badge-outline badge-sm">{userData.role.name}</div>
                      ) : (
                        <span className="text-gray-400 text-sm">Aucun</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-base-content/60">MINISTÈRE</span>
                    <div className="mt-1">
                      {userData.ministere ? (
                        <div className="badge badge-info badge-sm">{userData.ministere.abreviation}</div>
                      ) : (
                        <span className="text-gray-400 text-sm">Aucun</span>
                      )}
                    </div>
                  </div>
                </div>

                {userData.structure && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-base-content/60">STRUCTURE</span>
                    <div className="mt-1">
                      <div className="badge badge-secondary badge-sm">{userData.structure.name}</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {userData.isAdmin && (
                    <div className="badge badge-primary badge-sm">Admin</div>
                  )}
                  {userData.isApproved ? (
                    <div className="badge badge-success badge-sm">Approuvé</div>
                  ) : (
                    <div className="badge badge-warning badge-sm">En attente</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun utilisateur</h2>
            <p className="text-base-content/70 mb-4">
              Commencez par créer votre premier utilisateur.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un utilisateur
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}