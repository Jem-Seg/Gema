"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DiagnosticData {
  isMobile: boolean;
  viewport: { width: number; height: number };
  userAgent: string;
  sessionStatus: string;
  hasSession: boolean;
  timestamp: string;
}

export default function MobileTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({
    isMobile: false,
    viewport: { width: 0, height: 0 },
    userAgent: '',
    sessionStatus: 'loading',
    hasSession: false,
    timestamp: '',
  });

  useEffect(() => {
    // Éviter setState synchrone en utilisant un timeout
    const timer = setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      
      setDiagnostics({
        isMobile,
        viewport,
        userAgent: navigator.userAgent,
        sessionStatus: status,
        hasSession: !!session,
        timestamp: new Date().toISOString(),
      });
    }, 0);
    
    return () => clearTimeout(timer);
  }, [session, status]);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-4">🔍 Diagnostic Mobile GeStock</h1>
            
            {/* Status Session */}
            <div className="alert alert-info mb-4">
              <div>
                <h3 className="font-bold">Status de la session</h3>
                <p>Status: <span className="badge">{status}</span></p>
                <p>Session active: {session ? '✅ Oui' : '❌ Non'}</p>
              </div>
            </div>

            {/* Info utilisateur */}
            {session?.user && (() => {
              const user = session.user as { email?: string; name?: string; id?: string; isAdmin?: boolean; isApproved?: boolean; roleId?: string };
              return (
                <div className="alert alert-success mb-4">
                  <div>
                    <h3 className="font-bold">Utilisateur connecté</h3>
                    <p>Email: {user.email}</p>
                    <p>Nom: {user.name}</p>
                    <p>ID: {user.id}</p>
                    <p>Admin: {user.isAdmin ? '✅' : '❌'}</p>
                    <p>Approuvé: {user.isApproved ? '✅' : '❌'}</p>
                    <p>Role ID: {user.roleId || 'Non assigné'}</p>
                  </div>
                </div>
              );
            })()}

            {/* Diagnostics techniques */}
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2">Diagnostics techniques</h3>
              <div className="space-y-1 text-sm font-mono">
                <p>📱 Mobile: {diagnostics.isMobile ? 'OUI' : 'NON'}</p>
                <p>📐 Viewport: {diagnostics.viewport?.width}x{diagnostics.viewport?.height}</p>
                <p>🕐 Timestamp: {diagnostics.timestamp}</p>
                <p className="text-xs break-all">User Agent: {diagnostics.userAgent}</p>
              </div>
            </div>

            {/* Variables d'environnement */}
            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2">Configuration</h3>
              <div className="space-y-1 text-sm">
                <p>URL actuelle: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                <p>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</p>
                <p>Host: {typeof window !== 'undefined' ? window.location.host : 'N/A'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/')}
              >
                Retour à l&apos;accueil
              </button>
              {!session && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => router.push('/sign-in')}
                >
                  Se connecter
                </button>
              )}
              {session && (
                <button 
                  className="btn btn-error"
                  onClick={() => router.push('/api/auth/signout')}
                >
                  Se déconnecter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
