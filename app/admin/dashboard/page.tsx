"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  Users, 
  Building2, 
  Shield, 
  UserCheck, 
  UserX, 
  Settings,
  Database,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalMinisteres: number;
  totalStructures: number;
  totalRoles: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalMinisteres: 0,
    totalStructures: 0,
    totalRoles: 0
  });

  useEffect(() => {
    console.log('🏠 Admin Dashboard: useEffect appelé, status:', status);
    
    // Attendre que le status soit chargé
    if (status === 'loading') {
      console.log('⏳ Status loading, en attente...');
      return;
    }

    // Si pas authentifié, rediriger vers sign-in
    if (status === 'unauthenticated') {
      console.log('❌ Non authentifié, redirection vers /sign-in');
      router.push('/sign-in');
      return;
    }

    // Si authentifié mais pas encore de user dans la session, attendre
    if (status === 'authenticated' && !user) {
      console.log('⏳ Authentifié mais pas de user, en attente...');
      return;
    }

    // Si authentifié avec user, vérifier les permissions admin
    if (status === 'authenticated' && user) {
      console.log('✅ Authentifié avec user:', user.email);
      const verifyAdmin = async () => {
        try {
          console.log('🔍 Vérification statut admin...');
          const response = await fetch('/api/admin/verify');
          const data = await response.json();
          console.log('📋 Réponse /api/admin/verify:', data);
          
          if (!data.isAdmin) {
            console.log('❌ Pas admin, redirection vers /admin/verify');
            router.push('/admin/verify');
            return;
          }
          
          console.log('✅ Admin confirmé');
          setIsAdmin(true);
          
          // Récupérer les statistiques
          try {
            console.log('📊 Récupération statistiques...');
            const statsResponse = await fetch('/api/admin/stats');
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              console.log('✅ Statistiques reçues:', statsData.stats);
              setStats(statsData.stats);
            }
          } catch (error) {
            console.error('❌ Erreur récupération statistiques:', error);
          }
        } catch (error) {
          console.error('❌ Erreur vérification admin:', error);
          router.push('/admin/verify');
        } finally {
          console.log('🏁 Vérification terminée, setLoading(false)');
          setLoading(false);
        }
      };

      verifyAdmin();
    }
  }, [status, user, router]);



  if (loading || status !== 'authenticated') {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  if (!isAdmin) {
    return null; // L'utilisateur sera redirigé
  }

  const menuItems = [
    {
      title: 'Utilisateurs en attente',
      description: 'Approuver et assigner les nouveaux utilisateurs',
      icon: UserCheck,
      href: '/admin/users/pending',
      count: stats.pendingUsers,
      color: 'text-warning'
    },
    {
      title: 'Gestion des utilisateurs',
      description: 'Gérer tous les utilisateurs système',
      icon: Users,
      href: '/admin/users',
      count: stats.totalUsers,
      color: 'text-info'
    },
    {
      title: 'Ministères',
      description: 'Créer et gérer les ministères',
      icon: Building2,
      href: '/admin/ministeres',
      count: stats.totalMinisteres,
      color: 'text-primary'
    },
    {
      title: 'Structures',
      description: 'Gérer les structures des ministères',
      icon: Building2,
      href: '/admin/structures',
      count: stats.totalStructures,
      color: 'text-secondary'
    },
    {
      title: 'Rôles',
      description: 'Configurer les rôles système',
      icon: Shield,
      href: '/admin/roles',
      count: stats.totalRoles,
      color: 'text-accent'
    },
    {
      title: 'Sauvegarde & Restauration',
      description: 'Sauvegarder et restaurer la base de données',
      icon: Database,
      href: '/admin/backup',
      count: 0,
      color: 'text-success'
    },
    {
      title: 'Logs Système',
      description: 'Consulter et analyser les journaux d\'application',
      icon: FileText,
      href: '/admin/logs',
      count: 0,
      color: 'text-purple-500'
    },
    {
      title: 'Paramètres',
      description: 'Configuration générale du système',
      icon: Settings,
      href: '/admin/settings',
      count: 0,
      color: 'text-base-content'
    }
  ];

  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">
              Tableau de bord Admin
            </h1>
            <p className="text-sm sm:text-base text-base-content/70 truncate" title={(user as any)?.firstName || (user as any)?.email}>
              Bienvenue, {(user as any)?.firstName || (user as any)?.email}
            </p>
          </div>
          <div className="badge badge-primary badge-sm sm:badge-md lg:badge-lg shrink-0">
            Administrateur
          </div>
        </div>

        {stats.pendingUsers > 0 && (
          <div className="alert alert-warning p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserX className="w-5 h-5 shrink-0" />
                <span className="text-sm sm:text-base">
                  {stats.pendingUsers} utilisateur{stats.pendingUsers > 1 ? 's' : ''} en attente d&apos;approbation
                </span>
              </div>
              <button
                onClick={() => router.push('/admin/users/pending')}
                className="btn btn-sm btn-warning w-full sm:w-auto shrink-0"
              >
                <span className="hidden sm:inline">Voir les demandes</span>
                <span className="sm:hidden">Traiter</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item) => (
            <div
              key={item.title}
              className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group"
              onClick={() => router.push(item.href)}
            >
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-base-200 group-hover:bg-primary/10 transition-colors`}>
                      <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color} group-hover:text-primary transition-colors`} />
                    </div>
                    {item.count > 0 && (
                      <div className="badge badge-primary badge-sm">
                        {item.count}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <h2 className="card-title text-base sm:text-lg font-semibold leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <div className="card-actions">
                  <button className="btn btn-primary btn-sm w-full sm:w-auto sm:ml-auto group-hover:btn-primary group-hover:scale-105 transition-transform">
                    <span className="hidden sm:inline">Gérer</span>
                    <span className="sm:hidden">Ouvrir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}