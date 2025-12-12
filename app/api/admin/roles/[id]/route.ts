import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// PUT - Modifier un rôle
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id: roleId } = await context.params;
    const { name, description } = await request.json();

    // Vérifier que le rôle existe
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Rôle non trouvé' },
        { status: 404 }
      );
    }

    // Validation des données
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du rôle est obligatoire' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'La description du rôle est obligatoire' },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du nom de rôle (sauf pour le rôle actuel)
    const duplicateRole = await prisma.role.findFirst({
      where: {
        name: name.trim(),
        id: { not: roleId },
      },
    });

    if (duplicateRole) {
      return NextResponse.json(
        { error: 'Un rôle avec ce nom existe déjà' },
        { status: 409 }
      );
    }

    // Mettre à jour le rôle
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: name.trim(),
        description: description.trim(),
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rôle modifié avec succès',
      role: updatedRole,
    });
  } catch (error) {
    console.error('Erreur modification rôle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rôle
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id: roleId } = await context.params;

    // Vérifier que le rôle existe
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Rôle non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des utilisateurs avec ce rôle
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer ce rôle car ${existingRole._count.users} utilisateur(s) l'utilisent`
        },
        { status: 400 }
      );
    }

    // Supprimer le rôle
    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Rôle supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur suppression rôle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
