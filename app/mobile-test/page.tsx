"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MobileTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<any>({});

  useEffect(() => {
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
            {session?.user && (
              <div className="alert alert-success mb-4">
                <div>
                  <h3 className="font-bold">Utilisateur connecté</h3>
                  <p>Email: {session.user.email}</p>
                  <p>Nom: {session.user.name}</p>
                  <p>ID: {(session.user as any).id}</p>
                  <p>Admin: {(session.user as any).isAdmin ? '✅' : '❌'}</p>
                  <p>Approuvé: {(session.user as any).isApproved ? '✅' : '❌'}</p>
                  <p>Role ID: {(session.user as any).roleId || 'Non assigné'}</p>
                </div>
              </div>
            )}

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
                Retour à l'accueil
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
