"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PostSignInPage() {
  const [isReady, setIsReady] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Attendre un peu avant de commencer à vérifier la session
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Ne rien faire tant qu'on n'est pas prêt
    if (!isReady) {
      console.log('Waiting before checking session...');
      return;
    }

    // Empêcher les redirections multiples
    if (hasRedirected.current) {
      return;
    }

    // Si pas encore chargé, attendre
    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }

    // Si pas authentifié, retour à sign-in
    if (status === 'unauthenticated') {
      console.log('Not authenticated, redirecting to sign-in');
      hasRedirected.current = true;
      window.location.href = '/sign-in';
      return;
    }

    // Si authentifié, rediriger selon le type d'utilisateur
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      const isAdmin = user.isAdmin;
      const isApproved = user.isApproved;
      const hasRole = !!user.roleId;
      
      console.log('Authenticated, user status:', { isAdmin, isApproved, hasRole, user });
      
      hasRedirected.current = true;
      
      // Admin → dashboard admin
      if (isAdmin) {
        console.log('Redirecting admin to /admin/dashboard');
        window.location.href = '/admin/dashboard';
      } 
      // Non-admin approuvé avec rôle → dashboard utilisateur
      else if (isApproved && hasRole) {
        console.log('Redirecting approved user to /dashboard');
        window.location.href = '/dashboard';
      }
      // Non-admin non approuvé ou sans rôle → page d'attente avec option clé admin
      else {
        console.log('Redirecting non-approved user to /admin/verify');
        window.location.href = '/admin/verify';
      }
    }
  }, [isReady, status, session]);

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