import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// GET - Récupérer tous les rôles
export async function GET() {
  try {
    await requireAdmin();

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error('Erreur récupération rôles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau rôle
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { name, description, requiresStructure } = await request.json();

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

    // Vérifier l'unicité du nom de rôle
    const existingRole = await prisma.role.findFirst({
      where: {
        name: name.trim(),
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Un rôle avec ce nom existe déjà' },
        { status: 409 }
      );
    }

    // Créer le nouveau rôle
    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        requiresStructure: requiresStructure === true,
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
      message: 'Rôle créé avec succès',
      role: newRole,
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création rôle:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}