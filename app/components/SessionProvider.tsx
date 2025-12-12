"use client"
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('🔐 SessionProvider monté, basePath: /api/auth');
  }, []);

  return (
    <NextAuthSessionProvider 
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
