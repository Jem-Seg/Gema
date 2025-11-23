"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';

export default function PostSignInPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userStatus, setUserStatus] = useState<'checking' | 'admin-verify' | 'approved' | 'pending'>('checking');

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Synchroniser l'utilisateur avec la base de données
        const syncResponse = await fetch('/api/user/sync', {
          method: 'POST',
        });
        const syncData = await syncResponse.json();

        // Vérifier si c'est déjà un admin
        const adminResponse = await fetch('/api/admin/verify');
        const adminData = await adminResponse.json();

        if (adminData.isAdmin) {
          // Déjà admin, rediriger vers l'accueil
          router.push('/');
          return;
        }

        if (syncData.needsApproval) {
          // Proposer de devenir admin ou attendre
          setUserStatus('admin-verify');
        } else {
          // Utilisateur approuvé, rediriger vers l'accueil
          router.push('/');
        }
      } catch (error) {
        console.error('Erreur vérification statut:', error);
        setError('Erreur lors de la vérification du statut');
      }
    };

    if (status === 'authenticated' && !user) {
      router.push('/sign-in');
      return;
    }

    if (status === 'authenticated' && user) {
      checkUserStatus();
    }
  }, [status === 'authenticated', user, router]);

  const handleAdminVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();

      if (response.ok) {
        // Admin vérifié, rediriger vers l'accueil
        router.push('/');
      } else {
        setError(data.error || 'Clé de sécurité invalide');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const skipToHome = () => {
    router.push('/');
  };

  if (status !== 'authenticated' || userStatus === 'checking') {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  if (userStatus === 'admin-verify') {
    return (
      <Wrapper>
        <div className="max-w-md mx-auto mt-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h1 className="card-title text-2xl font-bold mb-4">
                Connexion réussie !
              </h1>
              
              <p className="text-sm text-base-content/70 mb-4">
                Bonjour {(user as any)?.firstName || (user as any)?.email},
              </p>

              <div className="space-y-4">
                <div className="alert alert-info">
                  <div>
                    <h3 className="font-bold">Êtes-vous administrateur ?</h3>
                    <p className="text-sm">
                      Si vous êtes administrateur, saisissez votre clé de sécurité pour accéder aux fonctionnalités d&apos;administration.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAdminVerification} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Clé de sécurité administrateur</span>
                    </label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="Entrez votre clé de sécurité"
                    />
                  </div>

                  {error && (
                    <div className="alert alert-error">
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !secretKey}
                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  >
                    {loading ? 'Vérification...' : 'Connexion Admin'}
                  </button>
                </form>

                <div className="divider">OU</div>

                <button
                  onClick={skipToHome}
                  className="btn btn-outline w-full"
                >
                  Continuer comme utilisateur
                </button>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

  return null;
}