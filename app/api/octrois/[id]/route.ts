import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

// PUT - Modifier un octroi (seulement pour Responsable achats et Agent de saisie, statut SAISIE uniquement)
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

    // Vérifier que l'utilisateur est Responsable achats ou Agent de saisie
    const allowedRoles = ['Responsable Achats', 'Responsable achats', 'Agent de saisie'];
    if (!allowedRoles.includes(dbUser.role?.name || '')) {
      return NextResponse.json(
        { success: false, message: 'Seuls les Responsables Achats et Agents de saisie peuvent modifier des octrois' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { structureId, produitId, quantite, beneficiaireNom, dateOctroi, reference } = body;

    // Validation
    if (!produitId || !quantite || !beneficiaireNom) {
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

    // Récupérer l'octroi
    const octroi = await prisma.octroi.findUnique({
      where: { id },
      include: { produit: true, structure: true }
    });

    if (!octroi) {
      return NextResponse.json(
        { success: false, message: 'Octroi non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le statut permet la modification (SAISIE, INSTANCE ou REJETE)
    const editableStatuses = ['SAISIE', 'INSTANCE_DIRECTEUR', 'INSTANCE_ORDONNATEUR', 'REJETE'];
    if (!editableStatuses.includes(octroi.statut)) {
      return NextResponse.json(
        { success: false, message: 'Impossible de modifier un octroi avec ce statut' },
        { status: 400 }
      );
    }

    // Vérifier que l'octroi n'est pas verrouillé (sauf REJETE)
    if (octroi.statut !== 'REJETE' && octroi.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Impossible de modifier un octroi verrouillé' },
        { status: 400 }
      );
    }

    // Vérifier les permissions selon le rôle
    if (dbUser.role?.name === 'Agent de saisie') {
      // Agent de saisie: seulement sa structure
      if (octroi.structureId !== dbUser.structureId) {
        return NextResponse.json(
          { success: false, message: 'Vous ne pouvez modifier que les octrois de votre structure' },
          { status: 403 }
        );
      }
    } else if (dbUser.role?.name === 'Responsable Achats' || dbUser.role?.name === 'Responsable achats') {
      // Responsable Achats: toutes les structures de son ministère
      if (octroi.ministereId !== dbUser.ministereId) {
        return NextResponse.json(
          { success: false, message: 'Vous ne pouvez modifier que les octrois de votre ministère' },
          { status: 403 }
        );
      }
    }

    // Récupérer le nouveau produit si changé
    let targetStructureId = structureId || octroi.structureId;
    let targetProduitId = produitId;

    if (produitId !== octroi.produitId) {
      const newProduit = await prisma.produit.findUnique({
        where: { id: produitId }
      });

      if (!newProduit) {
        return NextResponse.json(
          { success: false, message: 'Produit non trouvé' },
          { status: 404 }
        );
      }

      // Vérifier la structure du nouveau produit
      if (dbUser.role?.name === 'Agent de saisie') {
        if (newProduit.structureId !== dbUser.structureId) {
          return NextResponse.json(
            { success: false, message: 'Le produit doit appartenir à votre structure' },
            { status: 403 }
          );
        }
        targetStructureId = dbUser.structureId;
      } else if (dbUser.role?.name === 'Responsable Achats' || dbUser.role?.name === 'Responsable achats') {
        // Vérifier que le produit appartient à une structure du ministère
        const structure = await prisma.structure.findUnique({
          where: { id: newProduit.structureId }
        });

        if (!structure || structure.ministereId !== dbUser.ministereId) {
          return NextResponse.json(
            { success: false, message: 'Le produit doit appartenir à une structure de votre ministère' },
            { status: 403 }
          );
        }
        targetStructureId = targetStructureId || newProduit.structureId;
      }

      // Vérifier la quantité disponible
      if (quantite > newProduit.quantity) {
        return NextResponse.json(
          { success: false, message: `Quantité insuffisante (disponible: ${newProduit.quantity})` },
          { status: 400 }
        );
      }
    } else {
      // Même produit, vérifier que la nouvelle quantité est disponible
      const produit = await prisma.produit.findUnique({
        where: { id: produitId }
      });

      if (!produit) {
        return NextResponse.json(
          { success: false, message: 'Produit non trouvé' },
          { status: 404 }
        );
      }

      // Calculer les quantités en attente des AUTRES octrois (exclure l'octroi en cours)
      const autresOctroisEnAttente = await prisma.octroi.findMany({
        where: {
          produitId: produitId,
          id: { not: id }, // Exclure l'octroi en cours de modification
          statut: {
            in: ['SAISIE', 'INSTANCE_DIRECTEUR', 'VALIDE_DIRECTEUR', 'VALIDE_FINANCIER', 'INSTANCE_ORDONNATEUR']
          }
        },
        select: {
          quantite: true
        }
      });

      const quantiteEnAttente = autresOctroisEnAttente.reduce((total, o) => total + o.quantite, 0);

      // Calculer la quantité disponible (stock actuel - quantités en attente des autres octrois)
      const availableQuantity = produit.quantity - quantiteEnAttente;
      if (quantite > availableQuantity) {
        return NextResponse.json(
          { success: false, message: `Quantité insuffisante (disponible: ${availableQuantity} ${produit.unit}, en attente par d'autres: ${quantiteEnAttente} ${produit.unit})` },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'octroi
    const updatedOctroi = await prisma.octroi.update({
      where: { id },
      data: {
        structureId: targetStructureId,
        produitId: targetProduitId,
        quantite: parseInt(quantite),
        beneficiaireNom: beneficiaireNom,
        dateOctroi: dateOctroi ? new Date(dateOctroi) : octroi.dateOctroi,
        reference: reference || octroi.reference,
        // Remettre le statut à SAISIE si l'octroi était en instance ou rejeté
        statut: ['INSTANCE_DIRECTEUR', 'INSTANCE_ORDONNATEUR', 'REJETE'].includes(octroi.statut) ? 'SAISIE' : octroi.statut
      },
      include: {
        produit: true,
        structure: {
          include: {
            ministere: true
          }
        }
      }
    });

    // Enregistrer dans l'historique si le statut a changé
    if (['INSTANCE_DIRECTEUR', 'INSTANCE_ORDONNATEUR', 'REJETE'].includes(octroi.statut)) {
      await prisma.actionHistorique.create({
        data: {
          entityType: 'OCTROI',
          entityId: id,
          action: 'MODIFICATION',
          ancienStatut: octroi.statut,
          nouveauStatut: 'SAISIE',
          userId: dbUser.id,
          userRole: dbUser.role?.name || '',
          observations: 'Octroi modifié et remis en statut SAISIE'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Octroi modifié avec succès',
      data: updatedOctroi
    });
  } catch (error) {
    console.error('PUT /api/octrois/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un octroi (seulement pour Responsable achats et Agent de saisie, statut SAISIE uniquement)
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

    // Vérifier que l'utilisateur est Responsable achats, Agent de saisie ou Admin
    const allowedRoles = ['Responsable Achats', 'Responsable achats', 'Agent de saisie'];
    const isAdmin = dbUser.isAdmin;

    if (!allowedRoles.includes(dbUser.role?.name || '') && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seuls les Responsables Achats, Agents de saisie ou un administrateur peuvent supprimer des octrois' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Récupérer l'octroi
    const octroi = await prisma.octroi.findUnique({
      where: { id }
    });

    if (!octroi) {
      return NextResponse.json(
        { success: false, message: 'Octroi non trouvé' },
        { status: 404 }
      );
    }

    // Si l'octroi est validé, seul un admin peut le supprimer
    if (octroi.statut === 'VALIDE_ORDONNATEUR' && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Seul un administrateur peut supprimer un octroi validé par l\'ordonnateur' },
        { status: 403 }
      );
    }

    // Pour les non-admins, vérifier que le statut permet la suppression
    if (!isAdmin) {
      if (octroi.statut !== 'SAISIE') {
        return NextResponse.json(
          { success: false, message: 'Impossible de supprimer un octroi qui a déjà été validé' },
          { status: 400 }
        );
      }

      // Vérifier les permissions selon le rôle
      if (dbUser.role?.name === 'Agent de saisie') {
        // Agent de saisie: seulement sa structure
        if (octroi.structureId !== dbUser.structureId) {
          return NextResponse.json(
            { success: false, message: 'Vous ne pouvez supprimer que les octrois de votre structure' },
            { status: 403 }
          );
        }
      } else if (dbUser.role?.name === 'Responsable Achats' || dbUser.role?.name === 'Responsable achats') {
        // Responsable Achats: toutes les structures de son ministère
        if (octroi.ministereId !== dbUser.ministereId) {
          return NextResponse.json(
            { success: false, message: 'Vous ne pouvez supprimer que les octrois de votre ministère' },
            { status: 403 }
          );
        }
      }
    }

    // Vérifier que l'octroi n'est pas verrouillé (sauf pour les admins)
    if (octroi.isLocked && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Impossible de supprimer un octroi verrouillé' },
        { status: 400 }
      );
    }

    // Supprimer l'historique associé
    await prisma.actionHistorique.deleteMany({
      where: {
        entityType: 'OCTROI',
        entityId: id
      }
    });

    // Supprimer l'octroi
    await prisma.octroi.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Octroi supprimé avec succès'
    });
  } catch (error) {
    console.error('DELETE /api/octrois/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
