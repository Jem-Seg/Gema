import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const dbUser = await getCurrentUser();
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Non authentifié' }, 
        { status: 401 }
      );
    }

    if (!dbUser.isApproved) {
      return NextResponse.json(
        { error: 'Utilisateur non approuvé' },
        { status: 403 }
      );
    }

    let categories;

    // Filtrer les catégories selon le rôle
    if (dbUser.isAdmin) {
      // Admin : toutes les catégories
      categories = await prisma.category.findMany({
        include: {
          ministere: true
        },
        orderBy: { name: 'asc' }
      });
    } else if (dbUser.role?.name === "Agent de saisie" && dbUser.ministereId) {
      // Agent de saisie voit toutes les catégories de son ministère
      categories = await prisma.category.findMany({
        where: {
          ministereId: dbUser.ministereId
        },
        include: {
          ministere: true
        },
        orderBy: { name: 'asc' }
      });
    } else if (
      (dbUser.role?.name === "Responsable Achats" || 
       dbUser.role?.name === "Responsable achats" ||
       dbUser.role?.name === "Directeur Financier" || 
       dbUser.role?.name === "Responsable financier" ||
       dbUser.role?.name === "Ordonnateur") && 
      dbUser.ministereId
    ) {
      // Ministère : toutes les catégories du ministère
      const rawCategories = await prisma.category.findMany({
        where: {
          ministereId: dbUser.ministereId
        },
        include: {
          ministere: true
        },
        orderBy: { name: 'asc' }
      });

      // Dédupliquer les catégories ayant le même nom (cas-insensible)
  const seen = new Map<string, typeof rawCategories[number]>();
      for (const cat of rawCategories) {
        const key = (cat.name || '').trim().toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, cat);
        } else {
          // Si besoin, on pourrait agréger des structures ici
        }
      }
      categories = Array.from(seen.values());
    } else {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    return NextResponse.json({ categories }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}