import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const structureId = searchParams.get('structureId');
    const ministereId = searchParams.get('ministereId');

    // Récupérer l'utilisateur avec ses permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { 
        role: true,
        ministere: true,
      },
    });

    if (!user || !user.isApproved) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Construction du filtre
    const where: any = {};
    
    if (structureId) {
      where.structureId = structureId;
    } else if (ministereId) {
      where.ministereId = ministereId;
    } else if (user.ministereId) {
      where.ministereId = user.ministereId;
    }

    // Récupérer les informations du ministère et de la structure pour l'en-tête
    let entete = {
      ministere: '',
      structure: '',
    };

    if (structureId) {
      const structure = await prisma.structure.findUnique({
        where: { id: structureId },
        include: { ministere: true },
      });
      if (structure) {
        entete.ministere = structure.ministere.name;
        entete.structure = structure.name;
      }
    } else if (ministereId) {
      const ministere = await prisma.ministere.findUnique({
        where: { id: ministereId },
      });
      if (ministere) {
        entete.ministere = ministere.name;
        entete.structure = 'Toutes les structures';
      }
    } else if (user.ministere) {
      entete.ministere = user.ministere.name;
      entete.structure = 'Toutes les structures';
    }

    // Récupérer tous les produits avec leurs informations
    const produits = await prisma.produit.findMany({
      where,
      include: {
        category: true,
        structure: {
          include: {
            ministere: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculer les valeurs totales
    const stats = produits.reduce(
      (acc, produit) => {
        const valeurStock = (produit.price || 0) * produit.quantity;
        acc.totalArticles += 1;
        acc.totalQuantite += produit.quantity;
        acc.valeurTotale += valeurStock;
        
        // Calcul du seuil d'alerte (20% de la quantité initiale)
        const seuilAlerte = Math.ceil(produit.initialQuantity * 0.2);
        if (produit.quantity <= seuilAlerte && produit.quantity > 0) {
          acc.articlesAlerte += 1;
        }
        if (produit.quantity === 0) {
          acc.articlesEpuises += 1;
        }
        
        return acc;
      },
      { totalArticles: 0, totalQuantite: 0, valeurTotale: 0, articlesAlerte: 0, articlesEpuises: 0 }
    );

    // Grouper par catégorie
    const parCategorie = produits.reduce((acc: any, produit) => {
      const categoryName = produit.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          nom: categoryName,
          articles: 0,
          quantite: 0,
          valeur: 0,
        };
      }
      acc[categoryName].articles += 1;
      acc[categoryName].quantite += produit.quantity;
      acc[categoryName].valeur += (produit.price || 0) * produit.quantity;
      return acc;
    }, {});

    return NextResponse.json({
      entete,
      produits: produits.map(p => ({
        id: p.id,
        nom: p.name,
        description: p.description,
        categorie: p.category.name,
        quantite: p.quantity,
        quantiteInitiale: p.initialQuantity,
        unite: p.unit,
        prixUnitaire: p.price,
        valeurStock: (p.price || 0) * p.quantity,
        structure: p.structure.name,
        ministere: p.structure.ministere.name,
        seuilAlerte: Math.ceil(p.initialQuantity * 0.2),
        enAlerte: p.quantity <= Math.ceil(p.initialQuantity * 0.2) && p.quantity > 0,
        epuise: p.quantity === 0,
      })),
      statistiques: stats,
      parCategorie: Object.values(parCategorie),
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur état général stock:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'état' },
      { status: 500 }
    );
  }
}
