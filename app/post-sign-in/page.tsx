"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PostSignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      console.log('Session loading...');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('Not authenticated, redirecting to sign-in');
      router.replace('/sign-in');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      console.log('Authenticated, user status:', { 
        isAdmin: user.isAdmin, 
        isApproved: user.isApproved, 
        hasRole: !!user.roleId,
        user 
      });
      
      // Admin → dashboard admin
      if (user.isAdmin) {
        console.log('🎯 Admin → /admin/dashboard');
        router.replace('/admin/dashboard');
      } 
      // Non-admin approuvé avec rôle → dashboard utilisateur
      else if (user.isApproved && user.roleId) {
        console.log('👤 User → /dashboard');
        router.replace('/dashboard');
      }
      // Non-admin non approuvé ou sans rôle → page d'attente
      else {
        console.log('⏳ Pending → /admin/verify');
        router.replace('/admin/verify');
      }
    }
  }, [status, session, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-base-content/70">Redirection en cours...</p>
      </div>
    </div>
  );
}