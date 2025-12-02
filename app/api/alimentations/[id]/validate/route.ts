import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { validateAlimentation } from '@/lib/workflows/alimentation';

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

// POST - Valider une alimentation
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
    const authorizedRoles = [
      'Responsable Achats',
      'Responsable achats',
      'Directeur Financier',
      'Directeur financier',
      'Responsable financier',
      'Responsable Financier',
      'Directeur', 
      'Ordonnateur'
    ];
    if (!user.role?.name || !authorizedRoles.includes(user.role.name)) {
      return NextResponse.json(
        { error: 'Rôle non autorisé pour cette action' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { observations } = body;

    const result = await validateAlimentation(
      alimentationId,
      user.id,
      user.role.name,
      observations
    );

    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
  } catch (error) {
    console.error('POST /api/alimentations/[id]/validate error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}