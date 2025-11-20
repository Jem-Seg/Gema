import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { validateOctroi } from '@/lib/workflows/octroi';

// Fonction utilitaire pour récupérer les infos utilisateur
async function getUserInfo() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: 'Non authentifié', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      role: true,
      structure: true,
      ministere: true
    }
  });

  if (!dbUser || !dbUser.isApproved) {
    return { error: 'Utilisateur non approuvé', status: 403 };
  }

  return { user: dbUser };
}

// POST - Valider un octroi
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;
    const { id: octroiId } = await context.params;

    // Vérifier que l'utilisateur a un rôle autorisé
    const authorizedRoles = ['Directeur', 'Directeur de la structure', 'Directeur de structure', 'Directeur Financier', 'Responsable financier', 'Directeur financier', 'Ordonnateur'];
    if (!user.role?.name || !authorizedRoles.includes(user.role.name)) {
      return NextResponse.json(
        { error: 'Rôle non autorisé pour cette action' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { observations } = body;

    const result = await validateOctroi(
      octroiId,
      user.id,
      user.role.name,
      observations
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('POST /api/octrois/[id]/validate error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
