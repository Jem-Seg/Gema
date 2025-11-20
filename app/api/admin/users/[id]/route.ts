import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// PUT - Modifier un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id: userId } = await params;
    const data = await request.json();
    const {
      firstName,
      name,
      roleId,
      ministereId,
      structureId,
      isAdmin,
      isApproved,
    } = data;

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

    // Valider les données
    if (!firstName || !name) {
      return NextResponse.json(
        { error: 'Prénom et nom sont requis' },
        { status: 400 }
      );
    }

    // Valider la structure si le rôle l'exige
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (role?.requiresStructure && !structureId) {
        return NextResponse.json(
          { error: 'Ce rôle nécessite la sélection d\'une structure' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        name,
        isAdmin: isAdmin ?? false,
        isApproved: isApproved ?? false,
        roleId: roleId || null,
        ministereId: ministereId || null,
        structureId: structureId || null,
      },
      include: {
        role: true,
        ministere: true,
        structure: true,
      },
    });

    return NextResponse.json({
      message: 'Utilisateur modifié avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'utilisateur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id: userId } = await params;

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

    // Empêcher la suppression de son propre compte admin
    const currentUserData = await getCurrentUser();
    if (currentUserData && existingUser.id === currentUserData.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur de la base de données
    await prisma.user.delete({
      where: { id: userId },
    });

    // Note: Pour supprimer complètement l'utilisateur de Clerk,
    // il faudrait utiliser l'API Clerk. Ceci est optionnel.

    return NextResponse.json({
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}