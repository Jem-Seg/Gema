"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PostSignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
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
      window.location.replace('/sign-in');
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
        console.log('🎯 Redirecting admin to /admin/dashboard');
        console.log('🔧 Using aggressive navigation strategy');
        
        // Stratégie 1: Essayer window.location.href
        window.location.href = '/admin/dashboard';
        
        // Stratégie 2: Forcer avec replace après 100ms au cas où href ne marche pas
        setTimeout(() => {
          console.log('⏰ Timeout fallback - forcing navigation');
          window.location.replace('/admin/dashboard');
        }, 100);
        
        // Stratégie 3: Dernier recours après 200ms
        setTimeout(() => {
          console.log('🚨 Last resort - assigning directly');
          window.location.assign('/admin/dashboard');
        }, 200);
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
  }, [status, session, router]);

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