import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// PUT - Modifier une alimentation (seulement pour Responsable achats, statut SAISIE uniquement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { role: true }
    });

    if (!dbUser || !dbUser.isApproved) {
      return NextResponse.json({ error: 'Utilisateur non approuvé' }, { status: 403 });
    }

    // Vérifier que l'utilisateur est Responsable achats ou Admin
    const allowedRoles = ['Responsable Achats', 'Responsable achats'];
    const isAdmin = dbUser.isAdmin;
    if (!allowedRoles.includes(dbUser.role?.name || '') && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seul le Responsable achats ou un administrateur peut modifier des alimentations' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { quantite, prixUnitaire, fournisseurNom, fournisseurNIF } = body;

    // Validation
    if (!quantite || !prixUnitaire || !fournisseurNom) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (quantite <= 0) {
      return NextResponse.json(
        { success: false, message: 'La quantité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    if (prixUnitaire <= 0) {
      return NextResponse.json(
        { success: false, message: 'Le prix unitaire doit être supérieur à 0' },
        { status: 400 }
      );
    }

    // Récupérer l'alimentation
    const alimentation = await prisma.alimentation.findUnique({
      where: { id },
      include: { produit: true }
    });

    if (!alimentation) {
      return NextResponse.json(
        { success: false, message: 'Alimentation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que le statut permet la modification
    // Responsable achats : SAISIE ou INSTANCE_FINANCIER uniquement
    // Admin : SAISIE, INSTANCE_FINANCIER ou REJETE
    const editableStatuses = isAdmin 
      ? ['SAISIE', 'INSTANCE_FINANCIER', 'REJETE']
      : ['SAISIE', 'INSTANCE_FINANCIER'];
    if (!editableStatuses.includes(alimentation.statut)) {
      return NextResponse.json(
        { success: false, message: 'Impossible de modifier une alimentation qui a déjà été validée' },
        { status: 400 }
      );
    }

    // Vérifier que l'alimentation n'est pas verrouillée
    if (alimentation.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Impossible de modifier une alimentation verrouillée' },
        { status: 400 }
      );
    }

    // Mettre à jour l'alimentation et remettre en INSTANCE_FINANCIER
    const updatedAlimentation = await prisma.alimentation.update({
      where: { id },
      data: {
        quantite: parseFloat(quantite),
        prixUnitaire: parseFloat(prixUnitaire),
        fournisseurNom,
        fournisseurNIF: fournisseurNIF || null,
        statut: 'INSTANCE_FINANCIER' // Remettre en instance après modification
      },
      include: {
        produit: true,
        structure: {
          include: {
            ministere: true
          }
        },
        documents: true
      }
    });

    // Enregistrer l'action dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: 'ALIMENTATION',
        entityId: id,
        action: 'MODIFIE',
        ancienStatut: alimentation.statut,
        nouveauStatut: 'INSTANCE_FINANCIER',
        userId: dbUser.id,
        userRole: dbUser.role?.name || 'Inconnu',
        observations: `Modification: quantité=${quantite}, prix=${prixUnitaire}, fournisseur=${fournisseurNom}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Alimentation modifiée avec succès',
      data: updatedAlimentation
    });
  } catch (error) {
    console.error('PUT /api/alimentations/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une alimentation (seulement pour Agent de saisie et Responsable achats, statut SAISIE uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { role: true }
    });

    if (!dbUser || !dbUser.isApproved) {
      return NextResponse.json({ error: 'Utilisateur non approuvé' }, { status: 403 });
    }

    // Vérifier que l'utilisateur est Responsable achats ou Admin
    const allowedRoles = ['Responsable Achats', 'Responsable achats'];
    const isAdmin = dbUser.isAdmin;
    
    if (!allowedRoles.includes(dbUser.role?.name || '') && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seul le Responsable achats ou un administrateur peut supprimer des alimentations' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Récupérer l'alimentation
    const alimentation = await prisma.alimentation.findUnique({
      where: { id }
    });

    if (!alimentation) {
      return NextResponse.json(
        { success: false, message: 'Alimentation non trouvée' },
        { status: 404 }
      );
    }

    // Si l'alimentation est validée par l'ordonnateur, seul un admin peut la supprimer
    if (alimentation.statut === 'VALIDE_ORDONNATEUR' && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seul un administrateur peut supprimer une alimentation validée par l\'ordonnateur' },
        { status: 403 }
      );
    }

    // Pour les non-admins, vérifier que le statut permet la suppression
    if (!isAdmin) {
      const deletableStatuses = ['SAISIE', 'INSTANCE_FINANCIER', 'REJETE'];
      if (!deletableStatuses.includes(alimentation.statut)) {
        return NextResponse.json(
          { success: false, message: 'Impossible de supprimer une alimentation qui a déjà été validée' },
          { status: 400 }
        );
      }
    }

    // Vérifier que l'alimentation n'est pas verrouillée
    if (alimentation.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Impossible de supprimer une alimentation verrouillée' },
        { status: 400 }
      );
    }

    // Supprimer l'historique associé
    await prisma.actionHistorique.deleteMany({
      where: {
        entityType: 'ALIMENTATION',
        entityId: id
      }
    });

    // Supprimer l'alimentation
    await prisma.alimentation.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Alimentation supprimée avec succès'
    });
  } catch (error) {
    console.error('DELETE /api/alimentations/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
