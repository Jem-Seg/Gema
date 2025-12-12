import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier que l'utilisateur est admin
    await requireAdmin();

    // Récupérer l'ID de l'utilisateur depuis les params
    const { id: userId } = await context.params;

    // Récupérer les données de la requête
    const body = await request.json();
    const { roleId, ministereId } = body;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le rôle existe si fourni
    if (roleId && roleId !== '') {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return NextResponse.json(
          { error: 'Rôle non trouvé' },
          { status: 404 }
        );
      }

      // Dans le workflow simplifié, les utilisateurs ne sont pas assignés à une structure
      // Tous les utilisateurs travaillent au niveau ministère
    }

    // Vérifier que le ministère existe si fourni
    if (ministereId && ministereId !== '') {
      const ministere = await prisma.ministere.findUnique({
        where: { id: ministereId },
      });

      if (!ministere) {
        return NextResponse.json(
          { error: 'Ministère non trouvé' },
          { status: 404 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: roleId && roleId !== '' ? roleId : null,
        ministereId: ministereId && ministereId !== '' ? ministereId : null,
      },
      include: {
        role: true,
        ministere: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rôle attribué avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur attribution rôle:', error);

    if (error instanceof Error && error.message === 'Non authentifié') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Accès non autorisé') {
      return NextResponse.json(
        { error: 'Accès administrateur requis' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
