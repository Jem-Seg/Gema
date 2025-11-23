"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  Settings, 
  ArrowLeft, 
  Database,
  Shield,
  Users,
  FileText
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && !user) {
      router.push('/sign-in');
      return;
    }

    if (status === 'authenticated' && user) {
      // Vérifier les droits d'admin
      const verifyAdmin = async () => {
        try {
          const response = await fetch('/api/admin/verify');
          if (!response.ok) {
            router.push('/admin/verify');
            return;
          }
          setLoading(false);
        } catch (error) {
          console.error('Erreur vérification admin:', error);
          router.push('/admin/verify');
        }
      };

      verifyAdmin();
    }
  }, [status === 'authenticated', user, router]);

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="btn btn-ghost btn-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Retour au tableau de bord</span>
            <span className="sm:hidden">Retour</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Paramètres Système</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title text-base sm:text-lg mb-2">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Base de Données
              </h2>
              <p className="text-sm sm:text-base text-base-content/70 mb-4">
                Gérer la base de données et les sauvegardes
              </p>
              <div className="card-actions">
                <button className="btn btn-outline btn-sm w-full sm:w-auto sm:ml-auto" disabled>
                  Bientôt disponible
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title text-base sm:text-lg mb-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Sécurité
              </h2>
              <p className="text-sm sm:text-base text-base-content/70 mb-4">
                Configuration de la sécurité et des permissions
              </p>
              <div className="card-actions">
                <button className="btn btn-outline btn-sm w-full sm:w-auto sm:ml-auto" disabled>
                  Bientôt disponible
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title text-base sm:text-lg mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Paramètres Utilisateurs
              </h2>
              <p className="text-sm sm:text-base text-base-content/70 mb-4">
                Configuration par défaut pour les nouveaux utilisateurs
              </p>
              <div className="card-actions">
                <button className="btn btn-outline btn-sm w-full sm:w-auto sm:ml-auto" disabled>
                  Bientôt disponible
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title text-base sm:text-lg mb-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Rapports et Logs
              </h2>
              <p className="text-sm sm:text-base text-base-content/70 mb-4">
                Accéder aux journaux système et générer des rapports
              </p>
              <div className="card-actions">
                <button className="btn btn-outline btn-sm w-full sm:w-auto sm:ml-auto" disabled>
                  Bientôt disponible
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="alert alert-info p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <Settings className="w-5 h-5 shrink-0" />
            <span className="text-sm sm:text-base">
              Cette section sera développée dans les prochaines versions pour inclure des options de configuration avancées.
            </span>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}