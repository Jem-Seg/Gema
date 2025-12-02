import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// GET - Récupérer les produits accessibles par l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!dbUser.isApproved) {
      return NextResponse.json({ error: 'Utilisateur non approuvé' }, { status: 403 });
    }

    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    const structureIdParam = searchParams.get('structureId');
    const ministereIdParam = searchParams.get('ministereId');

    let whereClause: { structureId?: string; ministereId?: string } = {};

    // Si un structureId est fourni en paramètre, l'utiliser
    if (structureIdParam) {
      whereClause.structureId = structureIdParam;
    } else if (ministereIdParam) {
      whereClause.ministereId = ministereIdParam;
    } else {
      // Sinon, filtrer les produits selon le rôle - tous les utilisateurs voient leur ministère
      if (!dbUser.ministereId) {
        return NextResponse.json(
          { success: false, message: 'Ministère non défini' },
          { status: 400 }
        );
      }
      whereClause.ministereId = dbUser.ministereId;
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
      produits: produits,
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
