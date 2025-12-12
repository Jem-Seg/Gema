import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// POST - Basculer le statut d'un utilisateur
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id: userId } = await context.params;
    const { field } = await request.json();

    // Vérifier que le champ est valide
    if (!['isApproved', 'isAdmin'].includes(field)) {
      return NextResponse.json(
        { error: 'Champ non valide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher de se retirer ses propres droits admin
    const currentUserData = await getCurrentUser();
    if (
      currentUserData &&
      existingUser.id === currentUserData.id &&
      field === 'isAdmin' &&
      existingUser.isAdmin
    ) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas retirer vos propres droits d\'administrateur' },
        { status: 400 }
      );
    }

    // Basculer la valeur du champ
    const newValue = !existingUser[field as keyof typeof existingUser];

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        [field]: newValue,
      },
      include: {
        role: true,
        ministere: true,
      },
    });

    const action = field === 'isApproved'
      ? (newValue ? 'approuvé' : 'désapprouvé')
      : (newValue ? 'promu administrateur' : 'retiré des administrateurs');

    return NextResponse.json({
      message: `Utilisateur ${action} avec succès`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur basculement statut utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du statut' },
      { status: 500 }
    );
  }
}
