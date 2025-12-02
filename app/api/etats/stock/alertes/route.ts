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
    const type = searchParams.get('type') || 'tous'; // 'alerte', 'epuise', 'tous'

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

    // Récupérer tous les produits
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
        quantity: 'asc',
      },
    });

    // Filtrer selon le type d'alerte
    const produitsAvecAlerte = produits
      .map(p => {
        const seuilAlerte = Math.ceil(p.initialQuantity * 0.2);
        const pourcentageStock = p.initialQuantity > 0 
          ? (p.quantity / p.initialQuantity) * 100 
          : 0;
        
        return {
          ...p,
          seuilAlerte,
          pourcentageStock,
          enAlerte: p.quantity <= seuilAlerte && p.quantity > 0,
          epuise: p.quantity === 0,
        };
      })
      .filter(p => {
        if (type === 'epuise') return p.epuise;
        if (type === 'alerte') return p.enAlerte;
        return p.enAlerte || p.epuise;
      });

    // Statistiques
    const stats = {
      totalProduits: produits.length,
      produitsEnAlerte: produitsAvecAlerte.filter(p => p.enAlerte).length,
      produitsEpuises: produitsAvecAlerte.filter(p => p.epuise).length,
      valeurStockAlerte: produitsAvecAlerte
        .filter(p => p.enAlerte)
        .reduce((sum, p) => sum + ((p.price || 0) * p.quantity), 0),
    };

    // Grouper par niveau de criticité
    const parCriticite = {
      critique: produitsAvecAlerte.filter(p => p.epuise),
      urgent: produitsAvecAlerte.filter(p => !p.epuise && p.pourcentageStock <= 10),
      attention: produitsAvecAlerte.filter(p => !p.epuise && p.pourcentageStock > 10 && p.pourcentageStock <= 20),
    };

    return NextResponse.json({
      entete,
      produits: produitsAvecAlerte.map(p => ({
        id: p.id,
        nom: p.name,
        description: p.description,
        categorie: p.category.name,
        quantiteActuelle: p.quantity,
        quantiteInitiale: p.initialQuantity,
        seuilAlerte: p.seuilAlerte,
        pourcentageStock: p.pourcentageStock,
        unite: p.unit,
        prixUnitaire: p.price,
        valeurStock: (p.price || 0) * p.quantity,
        structure: p.structure.name,
        ministere: p.structure.ministere.name,
        statut: p.epuise ? 'EPUISE' : p.pourcentageStock <= 10 ? 'CRITIQUE' : 'ALERTE',
        enAlerte: p.enAlerte,
        epuise: p.epuise,
      })),
      statistiques: stats,
      parCriticite: {
        critique: parCriticite.critique.map(p => ({
          id: p.id,
          nom: p.name,
          categorie: p.category.name,
          structure: p.structure.name,
        })),
        urgent: parCriticite.urgent.map(p => ({
          id: p.id,
          nom: p.name,
          categorie: p.category.name,
          quantite: p.quantity,
          pourcentage: p.pourcentageStock,
          structure: p.structure.name,
        })),
        attention: parCriticite.attention.map(p => ({
          id: p.id,
          nom: p.name,
          categorie: p.category.name,
          quantite: p.quantity,
          pourcentage: p.pourcentageStock,
          structure: p.structure.name,
        })),
      },
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur état alertes stock:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'état' },
      { status: 500 }
    );
  }
}
