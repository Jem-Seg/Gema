import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// POST - Maintenir en instance (ajouter des observations sans changer le statut)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { role: true }
    });

    if (!dbUser || !dbUser.isApproved) {
      return NextResponse.json({ error: 'Utilisateur non approuvé' }, { status: 403 });
    }

    // Vérifier que l'utilisateur est Responsable financier
    const allowedRoles = ['Directeur Financier', 'Directeur financier', 'Responsable financier', 'Responsable Financier'];
    if (!allowedRoles.includes(dbUser.role?.name || '')) {
      return NextResponse.json(
        { success: false, message: 'Seul le Responsable financier peut effectuer cette action' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { observations } = body;

    if (!observations || observations.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Les observations sont obligatoires pour maintenir en instance' },
        { status: 400 }
      );
    }

    // Récupérer l'alimentation
    const alimentation = await prisma.alimentation.findUnique({
      where: { id },
      include: { produit: true }
    });

    if (!alimentation) {
      return NextResponse.json(
        { success: false, message: 'Alimentation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que le statut est INSTANCE_FINANCIER
    if (alimentation.statut !== 'INSTANCE_FINANCIER') {
      return NextResponse.json(
        { success: false, message: 'Cette action est uniquement disponible pour les alimentations en instance financière' },
        { status: 400 }
      );
    }

    // Vérifier que l'alimentation n'est pas verrouillée
    if (alimentation.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Impossible de modifier une alimentation verrouillée' },
        { status: 400 }
      );
    }

    // Mettre à jour les observations
    const updatedAlimentation = await prisma.alimentation.update({
      where: { id },
      data: {
        observations
      },
      include: {
        produit: true,
        structure: {
          include: {
            ministere: true
          }
        },
        documents: true
      }
    });

    // Enregistrer l'action dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: 'ALIMENTATION',
        entityId: id,
        action: 'INSTANCE',
        ancienStatut: alimentation.statut,
        nouveauStatut: 'INSTANCE_FINANCIER',
        userId: dbUser.id,
        userRole: dbUser.role?.name || 'Inconnu',
        observations
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Alimentation maintenue en instance avec observations',
      data: updatedAlimentation
    });
  } catch (error) {
    console.error('POST /api/alimentations/[id]/maintenir-instance error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
