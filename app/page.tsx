"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from "./components/Wrapper";
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { ShoppingBasket, TrendingUp, TrendingDown, Receipt, LayoutDashboard, Package } from 'lucide-react';
import { UserButton } from './components/UserButton';

interface UserStatus {
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    isAdmin: boolean;
    isApproved: boolean;
    roleId?: string | null;
    ministereId?: string | null;
    structureId?: string | null;
    role?: { id: string; name: string };
    ministere?: { id: string; name: string; abreviation: string };
    structure?: { id: string; name: string };
  };
  needsApproval: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const { isAdmin } = useAdminStatus();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      loadUserData();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [status, user]);

  const loadUserData = async () => {
    try {
      if (!(user as any)?.id) {
        setLoading(false);
        return;
      }

      // Récupérer les données utilisateur complètes
      const response = await fetch(`/api/user/${(user as any).id}`);
      
      if (!response.ok) {
        console.error('Erreur chargement utilisateur - Status:', response.status);
        // Si l'utilisateur n'existe pas (404), on considère qu'il n'est pas approuvé
        if (response.status === 404) {
          setUserStatus({
            user: null as any,
            needsApproval: true
          });
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      setUserStatus({
        user: data.user,
        needsApproval: !data.user.isApproved || !data.user.roleId
      });
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  if (!user) {
    // Rediriger vers la page de connexion si non authentifié
    if (status === 'unauthenticated') {
      router.push('/sign-in');
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      );
    }
    return (
      <Wrapper>
        <div className="hero min-h-[400px]">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold">GeStock</h1>
              <p className="py-6">
                Système de gestion des stocks pour les ministères et structures gouvernementales.
              </p>
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

  // Si l'utilisateur est en attente d'approbation et n'est pas admin
  if (userStatus?.needsApproval && !isAdmin) {
    return (
      <Wrapper>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="alert alert-warning">
            <div>
              <h3 className="font-bold">
                {!userStatus.user ? 'Session expirée ou compte introuvable' : 'Compte en attente d\'approbation'}
              </h3>
              <div className="text-sm mt-2">
                {!userStatus.user ? (
                  <>
                    <p>Votre session a expiré ou votre compte n'existe plus dans la base de données.</p>
                    <p className="mt-2">Veuillez vous reconnecter avec vos identifiants.</p>
                  </>
                ) : (
                  <>
                    Votre compte a été créé avec succès. Un administrateur doit maintenant :
                    <ul className="list-disc list-inside mt-2 ml-4">
                      {!userStatus.user?.isApproved && <li>Approuver votre compte</li>}
                      {!userStatus.user?.roleId && <li>Vous attribuer un rôle</li>}
                      {!userStatus.user?.ministereId && <li>Vous rattacher à un ministère</li>}
                    </ul>
                    <p className="mt-2">
                      Veuillez patienter ou contacter votre administrateur système.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {userStatus.user && (
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title">Informations de votre compte</h2>
                <div className="space-y-2">
                  <p><strong>Email :</strong> {userStatus.user?.email || (user as any)?.email}</p>
                  <p><strong>Nom :</strong> {userStatus.user?.name || (user as any)?.name}</p>
                  <p><strong>Statut :</strong> 
                    {!userStatus.user.isApproved && ' En attente d\'approbation'}
                    {userStatus.user.isApproved && !userStatus.user.roleId && ' Approuvé - En attente d\'attribution de rôle'}
                    {userStatus.user.isApproved && userStatus.user.roleId && !userStatus.user.ministereId && ' Rôle attribué - En attente d\'affectation ministère'}
                  </p>
                  {userStatus.user.roleId && (
                    <p><strong>Rôle :</strong> {userStatus.user.role?.name || 'Assigné'}</p>
                  )}
                  {userStatus.user.ministereId && (
                    <p><strong>Ministère :</strong> {userStatus.user.ministere?.name || 'Assigné'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-6 space-x-4">
            {!userStatus.user && (
              <button
                onClick={() => {
                  // Déconnecter l'utilisateur
                  window.location.href = '/api/auth/signout';
                }}
                className="btn btn-primary"
              >
                Se reconnecter
              </button>
            )}
            <button
              onClick={() => router.push('/admin/verify')}
              className="btn btn-outline btn-sm"
            >
              Êtes-vous administrateur ?
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* Header avec info utilisateur */}
        <div className="bg-linear-to-r from-[#8B4513] via-[#A0522D] to-[#CD853F] rounded-2xl shadow-2xl p-8 border-2 border-[#F1D2BF]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="avatar placeholder">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg ring-4 ring-[#F1D2BF]/50">
                  <span className="text-3xl font-bold text-[#793205]">
                    {userStatus?.user?.firstName?.[0] || (user as any)?.name?.[0] || 'U'}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#FFF8DC] drop-shadow-lg">
                  Bienvenue, <span className="text-[#FFE4B5]">{userStatus?.user?.firstName || (user as any)?.name || 'Utilisateur'}</span> !
                  {isAdmin && (
                    <span className="badge badge-warning ml-3 shadow-md">👑 Admin</span>
                  )}
                </h1>
                {userStatus?.user && (
                  <div className="mt-3 space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-[#F5DEB3] text-base">Rôle :</span>
                      <span className="badge bg-[#FFF8DC] text-[#793205] border-[#F5DEB3] badge-lg font-medium shadow-sm">
                        {userStatus.user.role?.name || 'Non assigné'}
                      </span>
                    </p>
                    {userStatus.user.ministere && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-[#F5DEB3] text-base">Ministère :</span>
                        <span className="text-[#FFF8DC] font-medium text-base">
                          {userStatus.user.ministere.abreviation}
                        </span>
                      </p>
                    )}
                    {userStatus.user.structure && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-[#F5DEB3] text-base">Structure :</span>
                        <span className="text-[#FFF8DC] font-medium text-base">
                          {userStatus.user.structure.name}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <UserButton />
              <button
                onClick={loadUserData}
                className={`btn btn-ghost btn-sm text-white hover:bg-white/20 border border-white/30 ${loading ? 'loading' : ''}`}
                disabled={loading}
                title="Actualiser les informations"
              >
                {!loading && '🔄 Actualiser'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className="stat bg-base-100 rounded-lg shadow-lg border-l-4 border-[#793205] cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/products')}
          >
            <div className="stat-figure text-[#793205]">
              <Package className="w-8 h-8" />
            </div>
            <div className="stat-title">Produits</div>
            <div className="stat-value text-[#793205]">Gérer</div>
            <div className="stat-desc">Inventaire complet</div>
          </div>

          <div
            className="stat bg-base-100 rounded-lg shadow-lg border-l-4 border-amber-600 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/alimentations')}
          >
            <div className="stat-figure text-amber-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Alimentations</div>
            <div className="stat-value text-amber-600">Stock</div>
            <div className="stat-desc">Entrées de stock</div>
          </div>

          <div
            className="stat bg-base-100 rounded-lg shadow-lg border-l-4 border-orange-600 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/octrois')}
          >
            <div className="stat-figure text-orange-600">
              <TrendingDown className="w-8 h-8" />
            </div>
            <div className="stat-title">Octrois</div>
            <div className="stat-value text-orange-600">Sorties</div>
            <div className="stat-desc">Distributions</div>
          </div>

          <div
            className="stat bg-base-100 rounded-lg shadow-lg border-l-4 border-blue-600 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
            onClick={() => router.push('/transactions')}
          >
            <div className="stat-figure text-blue-600">
              <Receipt className="w-8 h-8" />
            </div>
            <div className="stat-title">Transactions</div>
            <div className="stat-value text-blue-600">Suivre</div>
            <div className="stat-desc">Historique complet</div>
          </div>
        </div>

        {/* Navigation rapide */}
        {userStatus?.user && !userStatus.needsApproval && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#793205]" />
              Accès rapide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-[#793205]"
                onClick={() => router.push('/products')}
              >
                <div className="card-body items-center text-center">
                  <div className="p-4 rounded-full bg-[#F1D2BF]">
                    <ShoppingBasket className="w-8 h-8 text-[#793205]" />
                  </div>
                  <h3 className="card-title text-lg">Produits</h3>
                  <p className="text-sm text-base-content/70">
                    Gérer l&apos;inventaire des produits
                  </p>
                </div>
              </div>

              <div
                className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-amber-600"
                onClick={() => router.push('/alimentations')}
              >
                <div className="card-body items-center text-center">
                  <div className="p-4 rounded-full bg-amber-100">
                    <TrendingUp className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="card-title text-lg">Alimentations</h3>
                  <p className="text-sm text-base-content/70">
                    Enregistrer les entrées de stock
                  </p>
                </div>
              </div>

              <div
                className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-orange-600"
                onClick={() => router.push('/octrois')}
              >
                <div className="card-body items-center text-center">
                  <div className="p-4 rounded-full bg-orange-100">
                    <TrendingDown className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="card-title text-lg">Octrois</h3>
                  <p className="text-sm text-base-content/70">
                    Gérer les distributions
                  </p>
                </div>
              </div>

              <div
                className="card bg-base-100 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-600"
                onClick={() => router.push('/transactions')}
              >
                <div className="card-body items-center text-center">
                  <div className="p-4 rounded-full bg-blue-100">
                    <Receipt className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="card-title text-lg">Transactions</h3>
                  <p className="text-sm text-base-content/70">
                    Consulter l&apos;historique
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section tableau de bord */}
        {userStatus?.user && !userStatus.needsApproval && (
          <div className="card bg-linear-to-br from-[#F1D2BF]/30 to-base-100 shadow-xl border border-[#793205]/20">
            <div className="card-body">
              <h2 className="card-title text-[#793205]">
                <LayoutDashboard className="w-6 h-6" />
                Tableau de bord complet
              </h2>
              <p className="text-base-content/70">
                Consultez les statistiques détaillées et les graphiques de votre gestion de stock
              </p>
              <div className="card-actions justify-end mt-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn bg-[#793205] hover:bg-[#5a2404] text-white"
                >
                  Voir le tableau de bord
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
