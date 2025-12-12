import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { rejectAlimentation } from '@/lib/workflows/alimentation';

// POST - Rejeter une alimentation
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!user.isApproved) {
      return NextResponse.json({ error: 'Utilisateur non approuvé' }, { status: 403 });
    }
    const { id: alimentationId } = await context.params;

    // Seul l'ordonnateur peut rejeter
    if (user.role?.name !== 'Ordonnateur') {
      return NextResponse.json(
        { error: 'Seul l\'ordonnateur peut rejeter une alimentation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { observations } = body;

    // Observations obligatoires pour le rejet
    if (!observations || observations.trim() === '') {
      return NextResponse.json(
        { error: 'Les observations sont obligatoires pour rejeter une alimentation' },
        { status: 400 }
      );
    }

    const result = await rejectAlimentation(
      alimentationId,
      user.id,
      user.role.name,
      observations
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('POST /api/alimentations/[id]/reject error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
