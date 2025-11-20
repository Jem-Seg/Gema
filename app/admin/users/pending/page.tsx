"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { UserCheck, UserX, ArrowLeft } from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  createdAt: string;
}

interface Ministere {
  id: string;
  name: string;
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

interface PendingUsersData {
  pendingUsers: PendingUser[];
  ministeres: Ministere[];
  roles: Role[];
}

export default function PendingUsersPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PendingUsersData | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [initializingRoles, setInitializingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/users/pending');
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/admin/verify');
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Erreur chargement données' }));
        setError(errorData.error || 'Erreur chargement données');
        return;
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs en attente:', error);
      setError('Erreur de connexion au serveur');
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
        await loadPendingUsers();
      }
    };

    initializePage();
  }, [status === 'authenticated', user, router, loadPendingUsers]);

  const handleUserAction = async (
    userId: string, 
    action: 'approve' | 'reject',
    assignments?: {
      roleId: string;
      ministereId: string;
      structureId?: string;
    }
  ) => {
    setProcessingUser(userId);

    try {
      const response = await fetch('/api/admin/users/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          action,
          ...assignments
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Recharger les données
        await loadPendingUsers();
        alert(result.message);
      } else {
        alert(result.error || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Erreur traitement utilisateur:', error);
      alert('Erreur de connexion');
    } finally {
      setProcessingUser(null);
    }
  };

  const initializeRoles = async () => {
    setInitializingRoles(true);
    
    try {
      const response = await fetch('/api/admin/init-roles', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // Recharger les données pour afficher les nouveaux rôles
        await loadPendingUsers();
      } else {
        alert(result.error || 'Erreur lors de l\'initialisation des rôles');
      }
    } catch (error) {
      console.error('Erreur initialisation rôles:', error);
      alert('Erreur de connexion');
    } finally {
      setInitializingRoles(false);
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
          <span>{error || 'Erreur lors du chargement des données'}</span>
        </div>
        <button
          onClick={loadPendingUsers}
          className="btn btn-primary mt-4"
        >
          Réessayer
        </button>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </button>
            <h1 className="text-3xl font-bold">Utilisateurs en attente</h1>
            <div className="badge badge-warning">
              {data.pendingUsers.length} en attente
            </div>
          </div>

          {data.roles.length === 0 && (
            <button
              onClick={initializeRoles}
              className={`btn btn-primary btn-sm ${initializingRoles ? 'loading' : ''}`}
              disabled={initializingRoles}
            >
              {initializingRoles ? 'Initialisation...' : 'Initialiser les rôles'}
            </button>
          )}
        </div>

        {data.roles.length === 0 && (
          <div className="alert alert-warning">
            <div>
              <h3 className="font-bold">Aucun rôle configuré</h3>
              <p className="text-sm">
                Vous devez d&apos;abord initialiser les rôles système avant de pouvoir approuver des utilisateurs.
                Cliquez sur &quot;Initialiser les rôles&quot; pour créer les rôles par défaut.
              </p>
            </div>
          </div>
        )}

        {data.pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 mx-auto text-success mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun utilisateur en attente</h2>
            <p className="text-base-content/70">
              Tous les utilisateurs ont été traités.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.pendingUsers.map((pendingUser) => (
              <UserApprovalCard
                key={pendingUser.id}
                user={pendingUser}
                ministeres={data.ministeres}
                roles={data.roles}
                onAction={handleUserAction}
                isProcessing={processingUser === pendingUser.id}
              />
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

function UserApprovalCard({
  user,
  ministeres,
  roles,
  onAction,
  isProcessing
}: {
  user: PendingUser;
  ministeres: Ministere[];
  roles: Role[];
  onAction: (userId: string, action: 'approve' | 'reject', assignments?: {
    roleId: string;
    ministereId: string;
    structureId?: string;
  }) => void;
  isProcessing: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedMinistere, setSelectedMinistere] = useState('');
  const [selectedStructure, setSelectedStructure] = useState('');

  const selectedRoleData = roles.find(role => role.id === selectedRole);
  const selectedMinistereData = ministeres.find(m => m.id === selectedMinistere);

  const canApprove = selectedRole && selectedMinistere && 
    (!selectedRoleData?.requiresStructure || selectedStructure);

  const handleApprove = () => {
    if (!canApprove) return;

    onAction((user as any).id, 'approve', {
      roleId: selectedRole,
      ministereId: selectedMinistere,
      structureId: selectedRoleData?.requiresStructure ? selectedStructure : undefined
    });
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="card-title">{user.firstName} {user.name}</h3>
            <p className="text-base-content/70">{user.email}</p>
            <p className="text-sm text-base-content/60">
              Créé le {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="label">
              <span className="label-text">Rôle *</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isProcessing}
              title="Sélectionner un rôle"
            >
              <option value="">Choisir un rôle</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Ministère *</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedMinistere}
              onChange={(e) => {
                setSelectedMinistere(e.target.value);
                setSelectedStructure(''); // Reset structure
              }}
              disabled={isProcessing}
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

          {selectedRoleData?.requiresStructure && selectedMinistereData && (
            <div>
              <label className="label">
                <span className="label-text">Structure *</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedStructure}
                onChange={(e) => setSelectedStructure(e.target.value)}
                disabled={isProcessing}
                title="Sélectionner une structure"
              >
                <option value="">Choisir une structure</option>
                {selectedMinistereData.structures.map(structure => (
                  <option key={structure.id} value={structure.id}>
                    {structure.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="card-actions justify-end mt-4">
          <button
            onClick={() => onAction((user as any).id, 'reject')}
            className="btn btn-error btn-sm"
            disabled={isProcessing}
          >
            <UserX className="w-4 h-4 mr-2" />
            Rejeter
          </button>
          
          <button
            onClick={handleApprove}
            className={`btn btn-success btn-sm ${!canApprove ? 'btn-disabled' : ''}`}
            disabled={!canApprove || isProcessing}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            {isProcessing ? 'Traitement...' : 'Approuver'}
          </button>
        </div>
      </div>
    </div>
  );
}