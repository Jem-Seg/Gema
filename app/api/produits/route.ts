import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// GET - Récupérer les produits accessibles par l'utilisateur
export async function GET() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!dbUser.isApproved) {
      return NextResponse.json({ error: 'Utilisateur non approuvé' }, { status: 403 });
    }

    let whereClause: { structureId?: string; ministereId?: string } = {};

    // Filtrer les produits selon le rôle
    if (dbUser.role?.name === 'Agent de saisie' || dbUser.role?.name === 'Directeur') {
      // Uniquement les produits de leur structure
      if (!dbUser.structureId) {
        return NextResponse.json(
          { success: false, message: 'Structure non définie' },
          { status: 400 }
        );
      }
      whereClause.structureId = dbUser.structureId;
    } else if (
      dbUser.role?.name === 'Responsable Achats' ||
      dbUser.role?.name === 'Responsable achats' ||
      dbUser.role?.name === 'Directeur Financier' ||
      dbUser.role?.name === 'Directeur financier' ||
      dbUser.role?.name === 'Responsable financier' ||
      dbUser.role?.name === 'Responsable Financier' ||
      dbUser.role?.name === 'Ordonnateur'
    ) {
      // Tous les produits de leur ministère
      if (!dbUser.ministereId) {
        return NextResponse.json(
          { success: false, message: 'Ministère non défini' },
          { status: 400 }
        );
      }
      whereClause.ministereId = dbUser.ministereId;
    } else if (dbUser.isAdmin) {
      // Admins peuvent voir tous les produits
      whereClause = {};
    } else {
      return NextResponse.json(
        { success: false, message: 'Rôle non reconnu' },
        { status: 403 }
      );
    }

    const produits = await prisma.produit.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true
          }
        },
        structure: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: produits
    });
  } catch (error) {
    console.error('GET /api/produits error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
