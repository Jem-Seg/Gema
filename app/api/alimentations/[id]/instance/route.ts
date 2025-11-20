import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { instanceAlimentation } from '@/lib/workflows/alimentation';

// Fonction utilitaire pour récupérer les infos utilisateur
async function getUserInfo() {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    return { error: 'Non authentifié', status: 401 };
  }

  if (!dbUser.isApproved) {
    return { error: 'Utilisateur non approuvé', status: 403 };
  }

  return { user: dbUser };
}

// POST - Mettre en instance une alimentation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;
    const { id: alimentationId } = await params;

    // Vérifier que l'utilisateur a un rôle autorisé
    const authorizedRoles = ['Directeur Financier', 'Directeur financier', 'Directeur', 'Ordonnateur'];
    if (!user.role?.name || !authorizedRoles.includes(user.role.name)) {
      return NextResponse.json(
        { error: 'Rôle non autorisé pour cette action' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { observations } = body;

    // Observations obligatoires pour mise en instance
    if (!observations || observations.trim() === '') {
      return NextResponse.json(
        { error: 'Les observations sont obligatoires pour mettre en instance' },
        { status: 400 }
      );
    }

    const result = await instanceAlimentation(
      alimentationId,
      user.id,
      user.role.name,
      observations
    );

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('POST /api/alimentations/[id]/instance error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}