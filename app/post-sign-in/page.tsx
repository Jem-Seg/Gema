"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PostSignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si pas encore chargé, attendre
    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }

    // Si pas authentifié, retour à sign-in
    if (status === 'unauthenticated') {
      console.log('Not authenticated, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    // Si authentifié, rediriger selon le type d'utilisateur
    if (status === 'authenticated' && session?.user) {
      const isAdmin = (session.user as any).isAdmin;
      console.log('Authenticated, user is admin:', isAdmin, session?.user);
      
      // Admin → dashboard admin
      if (isAdmin) {
        console.log('Redirecting admin to /admin/dashboard');
        router.push('/admin/dashboard');
      } else {
        // Non-admin → homepage qui gérera l'approbation/rôle
        console.log('Redirecting non-admin to homepage');
        router.push('/');
      }
    }
  }, [status, router, session]);

  // Afficher un loader pendant le traitement
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-base-content/70">Redirection en cours...</p>
      </div>
    </div>
  );
}