import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// GET - Récupérer un ministère avec ses structures
export async function GET(
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

    const params = await context.params;
    const ministereId = params.id;

    const ministere = await prisma.ministere.findUnique({
      where: { id: ministereId },
      include: {
        structures: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!ministere) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ministère non trouvé' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: ministere 
    });
  } catch (error) {
    console.error('GET /api/ministeres/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
