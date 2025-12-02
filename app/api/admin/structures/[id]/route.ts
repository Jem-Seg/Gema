import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { checkAdminStatus } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    const { name, description, abreviation, ministereId } = await request.json();

    // Validation des données
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom de la structure est obligatoire' },
        { status: 400 }
      );
    }

    if (!ministereId || typeof ministereId !== 'string') {
      return NextResponse.json(
        { error: 'Le ministère est obligatoire' },
        { status: 400 }
      );
    }

    // Vérifier que la structure existe
    const existingStructure = await prisma.structure.findUnique({
      where: { id }
    });

    if (!existingStructure) {
      return NextResponse.json(
        { error: 'Structure non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que le ministère existe
    const ministere = await prisma.ministere.findUnique({
      where: { id: ministereId }
    });

    if (!ministere) {
      return NextResponse.json(
        { error: 'Ministère non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nom (exclure la structure actuelle)
    const duplicateStructure = await prisma.structure.findFirst({
      where: {
        name: name.trim(),
        ministereId,
        NOT: { id }
      }
    });

    if (duplicateStructure) {
      return NextResponse.json(
        { error: 'Une structure avec ce nom existe déjà dans ce ministère' },
        { status: 409 }
      );
    }

    // Mettre à jour la structure
    const updatedStructure = await prisma.structure.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        abreviation: abreviation?.trim() || null,
        ministereId
      },
      include: {
        ministere: {
          select: {
            id: true,
            name: true,
            abreviation: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Structure mise à jour avec succès',
      structure: updatedStructure
    });

  } catch (error) {
    console.error('Erreur mise à jour structure:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' }, 
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier que la structure existe
    const existingStructure = await prisma.structure.findUnique({
      where: { id }
    });

    if (!existingStructure) {
      return NextResponse.json(
        { error: 'Structure non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la structure (plus de vérification utilisateur car plus de relation)
    await prisma.structure.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Structure supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression structure:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}