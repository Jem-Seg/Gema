import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { createOctroi, getOctrois } from '@/lib/workflows/octroi';

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

// GET - Récupérer les octrois
export async function GET() {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;
    const userRole = user.isAdmin ? 'Admin' : (user.role?.name || '');
    const result = await getOctrois(
      user.id,
      userRole,
      user.structureId || undefined,
      user.ministereId || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/octrois error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel octroi
export async function POST(request: NextRequest) {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;

    // Vérifier que l'utilisateur est autorisé à créer des octrois
    const authorizedRoles = ['Responsable Achats', 'Responsable achats', 'Agent de saisie'];
    if (!user.role?.name || !authorizedRoles.includes(user.role.name)) {
      return NextResponse.json(
        { error: 'Seuls les Responsables Achats et Agents de saisie peuvent créer des octrois' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      structureId,
      produitId,
      quantite,
      beneficiaireNom,
      beneficiaireTelephone,
      motif,
      dateOctroi,
      reference
    } = body;

    // Validation des données
    if (!produitId || !quantite || !beneficiaireNom) {
      return NextResponse.json(
        { error: 'Données manquantes: produitId, quantite, beneficiaireNom sont requis' },
        { status: 400 }
      );
    }

    if (quantite <= 0) {
      return NextResponse.json(
        { error: 'La quantité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    // Vérifier que le produit existe
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

    // Déterminer la structure cible
    let targetStructureId = structureId;

    // Pour Agent de saisie, utiliser sa structure
    if (user.role.name === 'Agent de saisie') {
      targetStructureId = user.structureId;
      // Vérifier que le produit appartient à sa structure
      if (produit.structureId !== user.structureId) {
        return NextResponse.json(
          { error: 'Vous ne pouvez créer des octrois que pour les produits de votre structure' },
          { status: 403 }
        );
      }
    }
    // Pour Responsable Achats, vérifier que la structure est dans son ministère
    else if (user.role.name === 'Responsable Achats' || user.role.name === 'Responsable achats') {
      if (!targetStructureId) {
        return NextResponse.json(
          { error: 'La structure doit être spécifiée' },
          { status: 400 }
        );
      }

      // Vérifier que le produit appartient à la structure sélectionnée
      if (produit.structureId !== targetStructureId) {
        return NextResponse.json(
          { error: 'Le produit ne correspond pas à la structure sélectionnée' },
          { status: 400 }
        );
      }

      // Vérifier que la structure est dans son ministère
      if (produit.ministereId !== user.ministereId) {
        return NextResponse.json(
          { error: 'Vous ne pouvez créer des octrois que pour les structures de votre ministère' },
          { status: 403 }
        );
      }
    }

    const result = await createOctroi({
      produitId,
      quantite: parseInt(quantite),
      beneficiaireNom,
      beneficiaireTelephone,
      motif,
      dateOctroi,
      reference,
      ministereId: produit.ministereId,
      structureId: targetStructureId || produit.structureId,
      createurId: user.id,
      userRole: user.role.name
    });

    return NextResponse.json(result, {
      status: result.success ? 201 : 400
    });
  } catch (error) {
    console.error('POST /api/octrois error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
