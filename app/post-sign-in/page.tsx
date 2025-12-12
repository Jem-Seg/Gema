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
      const user = session.user as any;
      const isAdmin = user.isAdmin;
      const isApproved = user.isApproved;
      const hasRole = !!user.roleId;
      
      console.log('Authenticated, user status:', { isAdmin, isApproved, hasRole });
      
      // Admin → dashboard admin
      if (isAdmin) {
        console.log('Redirecting admin to /admin/dashboard');
        router.push('/admin/dashboard');
      } 
      // Non-admin approuvé avec rôle → dashboard utilisateur
      else if (isApproved && hasRole) {
        console.log('Redirecting approved user to /dashboard');
        router.push('/dashboard');
      }
      // Non-admin non approuvé ou sans rôle → page d'attente avec option clé admin
      else {
        console.log('Redirecting non-approved user to /admin/verify');
        router.push('/admin/verify');
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