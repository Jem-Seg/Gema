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
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const type = searchParams.get('type'); // 'entree', 'sortie', 'tous'

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
    const whereAlim: any = {};
    const whereOctroi: any = {};
    
    if (structureId) {
      whereAlim.structureId = structureId;
      whereOctroi.structureId = structureId;
    } else if (ministereId) {
      whereAlim.ministereId = ministereId;
      whereOctroi.ministereId = ministereId;
    } else if (user.ministereId) {
      whereAlim.ministereId = user.ministereId;
      whereOctroi.ministereId = user.ministereId;
    }

    // Récupérer les informations pour l'en-tête
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

    // Filtre par date
    if (dateDebut || dateFin) {
      const dateFilter: any = {};
      if (dateDebut) {
        dateFilter.gte = new Date(dateDebut);
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.lte = endDate;
      }
      whereAlim.createdAt = dateFilter;
      whereOctroi.createdAt = dateFilter;
    }

    // Ne récupérer que les mouvements validés
    whereAlim.statut = 'VALIDE_ORDONNATEUR';
    whereOctroi.statut = 'VALIDE_ORDONNATEUR';

    // Récupérer les mouvements
    const alimentations = type !== 'sortie' ? await prisma.alimentation.findMany({
      where: whereAlim,
      include: {
        produit: {
          include: {
            category: true,
          },
        },
        structure: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) : [];

    const octrois = type !== 'entree' ? await prisma.octroi.findMany({
      where: whereOctroi,
      include: {
        produit: {
          include: {
            category: true,
          },
        },
        structure: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) : [];

    // Combiner et trier les mouvements
    const mouvements = [
      ...alimentations.map(a => ({
        id: a.id,
        type: 'ENTREE' as const,
        numero: a.numero,
        date: a.createdAt,
        produit: {
          id: a.produit.id,
          nom: a.produit.name,
          categorie: a.produit.category.name,
        },
        quantite: a.quantite,
        prixUnitaire: a.prixUnitaire,
        valeur: a.quantite * a.prixUnitaire,
        reference: a.fournisseurNom,
        structure: a.structure.name,
        statut: a.statut,
      })),
      ...octrois.map(o => ({
        id: o.id,
        type: 'SORTIE' as const,
        numero: o.numero,
        date: o.createdAt,
        produit: {
          id: o.produit.id,
          nom: o.produit.name,
          categorie: o.produit.category.name,
        },
        quantite: o.quantite,
        prixUnitaire: o.produit.price || 0,
        valeur: o.quantite * (o.produit.price || 0),
        reference: o.beneficiaireNom,
        structure: o.structure.name,
        statut: o.statut,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculer les statistiques
    const stats = {
      totalMouvements: mouvements.length,
      totalEntrees: alimentations.length,
      totalSorties: octrois.length,
      quantiteEntree: alimentations.reduce((sum, a) => sum + a.quantite, 0),
      quantiteSortie: octrois.reduce((sum, o) => sum + o.quantite, 0),
      valeurEntree: alimentations.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0),
      valeurSortie: octrois.reduce((sum, o) => sum + (o.quantite * (o.produit.price || 0)), 0),
    };

    // Grouper par produit
    const parProduit: Record<string, any> = {};
    
    alimentations.forEach(a => {
      const key = a.produit.id;
      if (!parProduit[key]) {
        parProduit[key] = {
          produitId: a.produit.id,
          produitNom: a.produit.name,
          categorie: a.produit.category.name,
          entrees: 0,
          sorties: 0,
          valeurEntrees: 0,
          valeurSorties: 0,
        };
      }
      parProduit[key].entrees += a.quantite;
      parProduit[key].valeurEntrees += a.quantite * a.prixUnitaire;
    });

    octrois.forEach(o => {
      const key = o.produit.id;
      if (!parProduit[key]) {
        parProduit[key] = {
          produitId: o.produit.id,
          produitNom: o.produit.name,
          categorie: o.produit.category.name,
          entrees: 0,
          sorties: 0,
          valeurEntrees: 0,
          valeurSorties: 0,
        };
      }
      parProduit[key].sorties += o.quantite;
      parProduit[key].valeurSorties += o.quantite * (o.produit.price || 0);
    });

    // Grouper par période (mois)
    const parPeriode: Record<string, any> = {};
    
    mouvements.forEach(m => {
      const date = new Date(m.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!parPeriode[key]) {
        parPeriode[key] = {
          periode: key,
          entrees: 0,
          sorties: 0,
          valeurEntrees: 0,
          valeurSorties: 0,
        };
      }
      
      if (m.type === 'ENTREE') {
        parPeriode[key].entrees += m.quantite;
        parPeriode[key].valeurEntrees += m.valeur;
      } else {
        parPeriode[key].sorties += m.quantite;
        parPeriode[key].valeurSorties += m.valeur;
      }
    });

    return NextResponse.json({
      entete,
      mouvements,
      statistiques: stats,
      parProduit: Object.values(parProduit),
      parPeriode: Object.values(parPeriode).sort((a: any, b: any) => b.periode.localeCompare(a.periode)),
      filtres: {
        dateDebut: dateDebut || null,
        dateFin: dateFin || null,
        type: type || 'tous',
        structureId: structureId || null,
        ministereId: ministereId || null,
      },
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur mouvements par période:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'état' },
      { status: 500 }
    );
  }
}
