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
      return;
    }

    if (status === 'unauthenticated') {
      router.replace('/sign-in');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      // Admin → dashboard admin
      if (user.isAdmin) {
        router.replace('/admin/dashboard');
      } 
      // Non-admin approuvé avec rôle → dashboard utilisateur
      else if (user.isApproved && user.roleId) {
        router.replace('/dashboard');
      }
      // Non-admin non approuvé ou sans rôle → page d'attente
      else {
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