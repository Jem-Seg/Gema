import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { createAlimentation, getAlimentations } from '@/lib/workflows/alimentation';

// Fonction utilitaire pour récupérer les infos utilisateur
async function getUserInfo() {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    return { error: 'Non authentifié', status: 401 };
  }

  if (!dbUser.isApproved) {
    return { error: 'Utilisateur non approuvé', status: 403 };
  }

  return { user: dbUser };
}

// GET - Récupérer les alimentations
export async function GET() {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;
    const userRole = user.isAdmin ? 'Admin' : (user.role?.name || '');
    const result = await getAlimentations(
      user.id,
      userRole,
      user.structureId || undefined,
      user.ministereId || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/alimentations error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle alimentation
export async function POST(request: NextRequest) {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;

    // Vérifier que l'utilisateur est autorisé à créer des alimentations
    if (user.role?.name !== 'Responsable Achats' && user.role?.name !== 'Responsable achats') {
      return NextResponse.json(
        { error: 'Seuls les Responsables Achats peuvent créer des alimentations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      produitId,
      quantite,
      prixUnitaire,
      fournisseurNom,
      fournisseurNIF
    } = body;

    // Validation des données
    if (!produitId || !quantite || !prixUnitaire || !fournisseurNom) {
      return NextResponse.json(
        { error: 'Données manquantes: produitId, quantite, prixUnitaire, fournisseurNom sont requis' },
        { status: 400 }
      );
    }

    if (quantite <= 0) {
      return NextResponse.json(
        { error: 'La quantité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    if (prixUnitaire <= 0) {
      return NextResponse.json(
        { error: 'Le prix unitaire doit être supérieur à 0' },
        { status: 400 }
      );
    }

    // Vérifier que le produit existe et appartient au ministère
    const produit = await prisma.produit.findUnique({
      where: { id: produitId },
      include: { structure: true }
    });

    if (!produit) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    if (produit.ministereId !== user.ministereId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez créer des alimentations que pour les produits de votre ministère' },
        { status: 403 }
      );
    }

    const result = await createAlimentation({
      produitId,
      quantite: parseInt(quantite),
      prixUnitaire: parseFloat(prixUnitaire),
      fournisseurNom,
      fournisseurNIF,
      ministereId: user.ministereId!,
      structureId: produit.structureId,
      createurId: user.id
    });

    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    });
  } catch (error) {
    console.error('POST /api/alimentations error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}