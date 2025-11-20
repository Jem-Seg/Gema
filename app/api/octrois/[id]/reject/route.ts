import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { rejectOctroi } from '@/lib/workflows/octroi';

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

// POST - Rejeter un octroi
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

    // Seul l'ordonnateur peut rejeter
    if (user.role?.name !== 'Ordonnateur') {
      return NextResponse.json(
        { error: 'Seul l\'ordonnateur peut rejeter un octroi' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { observations } = body;

    // Observations obligatoires pour le rejet
    if (!observations || observations.trim() === '') {
      return NextResponse.json(
        { error: 'Les observations sont obligatoires pour rejeter un octroi' },
        { status: 400 }
      );
    }

    const result = await rejectOctroi(
      octroiId,
      user.id,
      user.role.name,
      observations
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('POST /api/octrois/[id]/reject error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
