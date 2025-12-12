import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// PUT - Modifier une alimentation (seulement pour Responsable achats, statut SAISIE uniquement)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    // Vérifier que l'utilisateur est Agent de saisie, Responsable achats ou Admin
    const allowedRoles = ['Agent de saisie', 'Responsable Achats', 'Responsable achats'];
    const isAdmin = dbUser.isAdmin;
    const isAgentSaisie = dbUser.role?.name === 'Agent de saisie';
    const isRespAchats = dbUser.role?.name === 'Responsable Achats' || dbUser.role?.name === 'Responsable achats';

    if (!allowedRoles.includes(dbUser.role?.name || '') && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seuls l\'Agent de saisie, le Responsable achats ou un administrateur peuvent modifier des alimentations' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
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

    // Vérifier que le statut permet la modification selon le rôle
    // EN_ATTENTE : Agent de saisie ET Responsable achats peuvent modifier
    // EN_INSTANCE_ACHATS : Agent de saisie ET Responsable achats peuvent modifier
    // VALIDE_ACHATS : Seul Responsable achats peut modifier
    // EN_INSTANCE_FINANCIER : Agent de saisie (→ EN_INSTANCE_ACHATS) ET Responsable achats peuvent modifier
    // MIS_EN_INSTANCE : Agent de saisie (→ EN_INSTANCE_ACHATS) ET Responsable achats (→ VALIDE_ACHATS) peuvent modifier
    // REJETE : Agent de saisie (→ EN_INSTANCE_ACHATS) ET Responsable achats (→ VALIDE_ACHATS) peuvent modifier
    // Admin peut tout modifier sauf VALIDE_ORDONNATEUR

    let nouveauStatut = alimentation.statut; // Par défaut, le statut reste inchangé

    if (!isAdmin) {
      if (alimentation.statut === 'EN_ATTENTE' || alimentation.statut === 'EN_INSTANCE_ACHATS') {
        // Agent de saisie ET Responsable achats peuvent modifier
        if (!isAgentSaisie && !isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Vous n\'avez pas les permissions pour modifier cette alimentation' },
            { status: 403 }
          );
        }
      } else if (alimentation.statut === 'VALIDE_ACHATS') {
        // Seul Responsable achats peut modifier
        if (!isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Seul le Responsable achats peut modifier une alimentation avec ce statut' },
            { status: 403 }
          );
        }
      } else if (alimentation.statut === 'EN_INSTANCE_FINANCIER') {
        // Agent de saisie ET Responsable achats peuvent modifier
        if (!isAgentSaisie && !isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Vous n\'avez pas les permissions pour modifier cette alimentation' },
            { status: 403 }
          );
        }
        // Si modifié par Agent de saisie, retourne au Responsable achats (EN_INSTANCE_ACHATS)
        // Si modifié par Responsable achats, reste ou devient VALIDE_ACHATS
        if (isAgentSaisie) {
          nouveauStatut = 'EN_INSTANCE_ACHATS';
        }
      } else if (alimentation.statut === 'MIS_EN_INSTANCE') {
        // Agent de saisie ET Responsable achats peuvent modifier une alimentation renvoyée par l'ordonnateur
        if (!isAgentSaisie && !isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Vous n\'avez pas les permissions pour modifier cette alimentation' },
            { status: 403 }
          );
        }
        // Si modifié par Agent de saisie, retourne au Responsable achats (EN_INSTANCE_ACHATS)
        // Si modifié par Responsable achats, retourne au Responsable Financier (VALIDE_ACHATS)
        if (isAgentSaisie) {
          nouveauStatut = 'EN_INSTANCE_ACHATS';
        } else if (isRespAchats) {
          nouveauStatut = 'VALIDE_ACHATS';
        }
      } else if (alimentation.statut === 'REJETE') {
        // Agent de saisie ET Responsable achats peuvent modifier une alimentation rejetée
        if (!isAgentSaisie && !isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Vous n\'avez pas les permissions pour modifier cette alimentation' },
            { status: 403 }
          );
        }
        // Si modifié par Agent de saisie, retourne au Responsable achats (EN_INSTANCE_ACHATS)
        // Si modifié par Responsable achats, retourne au Responsable Financier (VALIDE_ACHATS)
        if (isAgentSaisie) {
          nouveauStatut = 'EN_INSTANCE_ACHATS';
        } else if (isRespAchats) {
          nouveauStatut = 'VALIDE_ACHATS';
        }
      } else {
        // Autres statuts : non modifiable
        return NextResponse.json(
          { success: false, message: 'Impossible de modifier une alimentation avec ce statut' },
          { status: 400 }
        );
      }
    } else {
      // Admin ne peut pas modifier les alimentations validées par l'ordonnateur
      if (alimentation.statut === 'VALIDE_ORDONNATEUR') {
        return NextResponse.json(
          { success: false, message: 'Impossible de modifier une alimentation validée par l\'ordonnateur' },
          { status: 400 }
        );
      }
      // Admin modifiant une alimentation REJETE ou EN_INSTANCE_ORDONNATEUR la renvoie aussi en EN_INSTANCE_FINANCIER
      if (alimentation.statut === 'REJETE' || alimentation.statut === 'EN_INSTANCE_ORDONNATEUR') {
        nouveauStatut = 'EN_INSTANCE_FINANCIER';
      }
    }

    // Vérifier que l'alimentation n'est pas verrouillée
    if (alimentation.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Impossible de modifier une alimentation verrouillée' },
        { status: 400 }
      );
    }

    // Mettre à jour l'alimentation
    const updatedAlimentation = await prisma.alimentation.update({
      where: { id },
      data: {
        quantite: parseFloat(quantite),
        prixUnitaire: parseFloat(prixUnitaire),
        fournisseurNom,
        fournisseurNIF: fournisseurNIF || null,
        statut: nouveauStatut // Changement automatique si REJETE → EN_INSTANCE_FINANCIER
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
        nouveauStatut: nouveauStatut,
        userId: dbUser.id,
        userRole: dbUser.role?.name || 'Inconnu',
        observations: alimentation.statut === 'REJETE'
          ? `Modification après rejet: quantité=${quantite}, prix=${prixUnitaire}, fournisseur=${fournisseurNom} - Renvoi au Responsable Financier`
          : alimentation.statut === 'EN_INSTANCE_ORDONNATEUR'
            ? `Modification après correction ordonnateur: quantité=${quantite}, prix=${prixUnitaire}, fournisseur=${fournisseurNom} - Renvoi au Responsable Financier`
            : `Modification: quantité=${quantite}, prix=${prixUnitaire}, fournisseur=${fournisseurNom}`
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
  context: { params: Promise<{ id: string }> }
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

    // Vérifier que l'utilisateur est Agent de saisie, Responsable achats ou Admin
    const allowedRoles = ['Agent de saisie', 'Responsable Achats', 'Responsable achats'];
    const isAdmin = dbUser.isAdmin;
    const isAgentSaisie = dbUser.role?.name === 'Agent de saisie';
    const isRespAchats = dbUser.role?.name === 'Responsable Achats' || dbUser.role?.name === 'Responsable achats';

    if (!allowedRoles.includes(dbUser.role?.name || '') && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seuls l\'Agent de saisie, le Responsable achats ou un administrateur peuvent supprimer des alimentations' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

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

    // Pour les non-admins, vérifier que le statut et le rôle permettent la suppression
    if (!isAdmin) {
      if (alimentation.statut === 'EN_ATTENTE' || alimentation.statut === 'EN_INSTANCE_ACHATS') {
        // Agent de saisie ET Responsable achats peuvent supprimer
        if (!isAgentSaisie && !isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Vous n\'avez pas les permissions pour supprimer cette alimentation' },
            { status: 403 }
          );
        }
      } else if (alimentation.statut === 'EN_INSTANCE_FINANCIER' || alimentation.statut === 'MIS_EN_INSTANCE' || alimentation.statut === 'REJETE') {
        // Agent de saisie ET Responsable achats peuvent supprimer
        if (!isAgentSaisie && !isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Vous n\'avez pas les permissions pour supprimer cette alimentation' },
            { status: 403 }
          );
        }
      } else if (alimentation.statut === 'EN_INSTANCE_ORDONNATEUR') {
        // Seul Responsable achats peut supprimer
        if (!isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Seul le Responsable achats peut supprimer une alimentation avec ce statut' },
            { status: 403 }
          );
        }
      } else if (alimentation.statut === 'VALIDE_ORDONNATEUR') {
        return NextResponse.json(
          { success: false, message: 'Impossible de supprimer une alimentation validée par l\'ordonnateur' },
          { status: 403 }
        );
      } else {
        // Autres statuts : supprimable par Responsable achats
        if (!isRespAchats) {
          return NextResponse.json(
            { success: false, message: 'Seul le Responsable achats peut supprimer une alimentation avec ce statut' },
            { status: 403 }
          );
        }
      }
    } else {
      // Admin ne peut pas supprimer les alimentations validées par l'ordonnateur sauf si force
      if (alimentation.statut === 'VALIDE_ORDONNATEUR') {
        return NextResponse.json(
          { success: false, message: 'Seul un administrateur avec permissions spéciales peut supprimer une alimentation validée par l\'ordonnateur' },
          { status: 403 }
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
