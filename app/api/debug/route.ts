import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Vérifier les variables d'environnement (masquées)
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Défini' : '❌ Manquant',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant',
    };

    // Test de connexion à la base de données
    let dbStatus = '❌ Erreur';
    let userCount = 0;
    
    try {
      userCount = await prisma.user.count();
      dbStatus = '✅ Connecté';
    } catch (dbError: any) {
      dbStatus = `❌ ${dbError.message}`;
    }

    return NextResponse.json({
      status: 'ok',
      environment: env,
      database: {
        status: dbStatus,
        userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
