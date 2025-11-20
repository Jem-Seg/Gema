import prisma from '@/lib/prisma';

// Types pour les statuts d'alimentation
export type AlimentationStatus = 
  | "SAISIE" 
  | "INSTANCE_FINANCIER" 
  | "VALIDE_FINANCIER" 
  | "INSTANCE_DIRECTEUR" 
  | "VALIDE_DIRECTEUR" 
  | "INSTANCE_ORDONNATEUR" 
  | "VALIDE_ORDONNATEUR" 
  | "REJETE";

// Interface pour la création d'une alimentation
export interface CreateAlimentationData {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  fournisseurNom: string;
  fournisseurNIF?: string;
  ministereId: string;
  structureId: string;
  createurId: string;
}

// Génération automatique du numéro d'alimentation
async function generateAlimentationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastAlimentation = await prisma.alimentation.findFirst({
    where: {
      numero: {
        startsWith: `ALI-${year}-`
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastAlimentation) {
    const lastNumber = parseInt(lastAlimentation.numero.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `ALI-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// Créer une nouvelle alimentation
export async function createAlimentation(data: CreateAlimentationData) {
  try {
    const numero = await generateAlimentationNumber();
    
    const alimentation = await prisma.alimentation.create({
      data: {
        numero,
        produitId: data.produitId,
        quantite: data.quantite,
        prixUnitaire: data.prixUnitaire,
        fournisseurNom: data.fournisseurNom,
        fournisseurNIF: data.fournisseurNIF,
        statut: "INSTANCE_FINANCIER",
        ministereId: data.ministereId,
        structureId: data.structureId,
        createurId: data.createurId
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

    // Écrire dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: "ALIMENTATION",
        entityId: alimentation.id,
        action: "CREATION",
        ancienStatut: "",
        nouveauStatut: "INSTANCE_FINANCIER",
        userId: data.createurId,
        userRole: "Responsable Achats"
      }
    });

    return {
      success: true,
      data: alimentation,
      message: `Alimentation ${numero} créée avec succès`
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'alimentation:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de l\'alimentation'
    };
  }
}

// Mettre en instance une alimentation
export async function instanceAlimentation(
  alimentationId: string, 
  userId: string, 
  userRole: string, 
  observations?: string
) {
  try {
    const alimentation = await prisma.alimentation.findUnique({
      where: { id: alimentationId },
      include: { produit: true }
    });

    if (!alimentation) {
      return { success: false, message: "Alimentation non trouvée" };
    }

    if (alimentation.isLocked) {
      return { success: false, message: "Alimentation verrouillée" };
    }

    // Déterminer le nouveau statut selon le rôle
    let nouveauStatut: AlimentationStatus;
    switch (userRole) {
      case "Directeur":
        if (alimentation.statut !== "VALIDE_FINANCIER") {
          if (alimentation.statut === "INSTANCE_FINANCIER") {
            return { success: false, message: "Cette alimentation doit d'abord être validée par le Responsable financier avant de pouvoir être mise en instance" };
          } else if (alimentation.statut === "VALIDE_DIRECTEUR") {
            return { success: false, message: "Cette alimentation a déjà été validée par le Directeur" };
          }
          return { success: false, message: "Vous ne pouvez mettre en instance que les alimentations validées par le Responsable financier" };
        }
        // Retourne au Responsable achats pour modification
        nouveauStatut = "INSTANCE_FINANCIER";
        break;
      case "Ordonnateur":
        if (alimentation.statut !== "VALIDE_DIRECTEUR") {
          if (alimentation.statut === "VALIDE_FINANCIER") {
            return { success: false, message: "Cette alimentation doit d'abord être validée par le Directeur de la structure" };
          } else if (alimentation.statut === "INSTANCE_ORDONNATEUR") {
            return { success: false, message: "Cette alimentation est déjà en instance ordonnateur" };
          } else if (alimentation.statut === "INSTANCE_FINANCIER") {
            return { success: false, message: "Cette alimentation est en cours de traitement par le Responsable financier" };
          }
          return { success: false, message: "Vous ne pouvez mettre en instance que les alimentations validées par le Directeur" };
        }
        // Retourne au Directeur qui pourra mettre en instance vers le Responsable achats
        nouveauStatut = "VALIDE_FINANCIER";
        break;
      default:
        return { success: false, message: "Rôle non autorisé pour cette action" };
    }

    // Mettre à jour l'alimentation
    const updatedAlimentation = await prisma.alimentation.update({
      where: { id: alimentationId },
      data: {
        statut: nouveauStatut,
        observations
      }
    });

    // Écrire dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: "ALIMENTATION",
        entityId: alimentationId,
        action: "INSTANCE",
        ancienStatut: alimentation.statut,
        nouveauStatut,
        userId,
        userRole,
        observations
      }
    });

    return {
      success: true,
      data: updatedAlimentation,
      message: `Alimentation mise en instance (${nouveauStatut})`
    };
  } catch (error) {
    console.error('Erreur lors de la mise en instance:', error);
    return { success: false, message: 'Erreur lors de la mise en instance' };
  }
}

// Valider une alimentation
export async function validateAlimentation(
  alimentationId: string, 
  userId: string, 
  userRole: string, 
  observations?: string
) {
  try {
    const alimentation = await prisma.alimentation.findUnique({
      where: { id: alimentationId },
      include: { produit: true }
    });

    if (!alimentation) {
      return { success: false, message: "Alimentation non trouvée" };
    }

    if (alimentation.isLocked) {
      return { success: false, message: "Alimentation verrouillée" };
    }

    // Déterminer le nouveau statut selon le rôle
    let nouveauStatut: AlimentationStatus;
    let shouldUpdateStock = false;

    switch (userRole) {
      case "Directeur Financier":
      case "Directeur financier":
      case "Responsable financier":
      case "Responsable Financier":
        if (alimentation.statut !== "INSTANCE_FINANCIER") {
          if (alimentation.statut === "VALIDE_FINANCIER") {
            return { success: false, message: "Cette alimentation a déjà été validée par le Responsable financier" };
          } else if (alimentation.statut === "SAISIE") {
            return { success: false, message: "Cette alimentation est en cours de saisie" };
          }
          return { success: false, message: "Vous ne pouvez valider que les alimentations en instance financier" };
        }
        nouveauStatut = "VALIDE_FINANCIER";
        break;
      case "Directeur":
        if (alimentation.statut !== "VALIDE_FINANCIER") {
          if (alimentation.statut === "INSTANCE_FINANCIER") {
            return { success: false, message: "Cette alimentation doit d'abord être validée par le Responsable financier" };
          } else if (alimentation.statut === "INSTANCE_DIRECTEUR") {
            return { success: false, message: "Cette alimentation est en instance. Utilisez le bouton 'Mettre en instance' pour la renvoyer au Responsable achats avec vos observations" };
          }
          return { success: false, message: "Vous ne pouvez valider que les alimentations validées par le Responsable financier" };
        }
        nouveauStatut = "VALIDE_DIRECTEUR";
        break;
      case "Ordonnateur":
        if (alimentation.statut !== "INSTANCE_ORDONNATEUR" && alimentation.statut !== "VALIDE_DIRECTEUR") {
          if (alimentation.statut === "VALIDE_FINANCIER") {
            return { success: false, message: "Cette alimentation doit d'abord être validée par le Directeur de la structure" };
          } else if (alimentation.statut === "INSTANCE_FINANCIER") {
            return { success: false, message: "Cette alimentation est en cours de traitement par le Responsable financier" };
          }
          return { success: false, message: "Vous ne pouvez valider que les alimentations validées par le Directeur ou en instance ordonnateur" };
        }
        nouveauStatut = "VALIDE_ORDONNATEUR";
        shouldUpdateStock = true;
        break;
      default:
        return { success: false, message: "Rôle non autorisé pour cette action" };
    }

    // Transaction atomique pour mettre à jour l'alimentation et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'alimentation
      const updatedAlimentation = await tx.alimentation.update({
        where: { id: alimentationId },
        data: {
          statut: nouveauStatut,
          observations,
          isLocked: shouldUpdateStock // Verrouiller si c'est la validation finale
        }
      });

      // Si validation ordonnateur : mettre à jour le stock
      if (shouldUpdateStock) {
        // Vérifier que le produit existe
        const produit = await tx.produit.findFirst({
          where: { 
            id: alimentation.produitId,
            structureId: alimentation.structureId 
          }
        });

        if (!produit) {
          throw new Error(`Produit avec l'ID ${alimentation.produitId} non trouvé dans la structure`);
        }

        // Mettre à jour la quantité et le prix unitaire
        await tx.produit.update({
          where: { id: alimentation.produitId },
          data: {
            quantity: {
              increment: alimentation.quantite
            },
            price: alimentation.prixUnitaire // Mettre à jour avec le prix unitaire de l'alimentation
          }
        });

        // Créer une transaction pour l'historique
        await tx.transaction.create({
          data: {
            type: "entree",
            quantity: alimentation.quantite,
            produitId: alimentation.produitId,
            ministereId: alimentation.ministereId,
            structureId: alimentation.structureId,
            fournisseurNom: alimentation.fournisseurNom,
            fournisseurNIF: alimentation.fournisseurNIF,
            alimentationId: alimentation.id // Lier la transaction à son alimentation source
          }
        });
      }

      // Écrire dans l'historique
      await tx.actionHistorique.create({
        data: {
          entityType: "ALIMENTATION",
          entityId: alimentationId,
          action: "VALIDER",
          ancienStatut: alimentation.statut,
          nouveauStatut,
          userId,
          userRole,
          observations
        }
      });

      return updatedAlimentation;
    });

    return {
      success: true,
      data: result,
      message: shouldUpdateStock 
        ? `Alimentation validée et stock mis à jour (+${alimentation.quantite} ${alimentation.produit.unit})`
        : `Alimentation validée (${nouveauStatut})`
    };
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return { success: false, message: 'Erreur lors de la validation' };
  }
}

// Rejeter une alimentation
export async function rejectAlimentation(
  alimentationId: string, 
  userId: string, 
  userRole: string, 
  observations: string
) {
  try {
    const alimentation = await prisma.alimentation.findUnique({
      where: { id: alimentationId }
    });

    if (!alimentation) {
      return { success: false, message: "Alimentation non trouvée" };
    }

    if (alimentation.isLocked) {
      return { success: false, message: "Alimentation verrouillée" };
    }

    // Seul l'ordonnateur peut rejeter
    if (userRole !== "Ordonnateur") {
      return { success: false, message: "Seul l'ordonnateur peut rejeter une alimentation" };
    }

    if (alimentation.statut !== "INSTANCE_ORDONNATEUR" && alimentation.statut !== "VALIDE_DIRECTEUR") {
      return { success: false, message: "Statut invalide pour cette action" };
    }

    // Mettre à jour l'alimentation
    const updatedAlimentation = await prisma.alimentation.update({
      where: { id: alimentationId },
      data: {
        statut: "REJETE",
        observations
        // Ne pas verrouiller pour permettre au Responsable achats de supprimer ou à l'Admin de modifier
      }
    });

    // Écrire dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: "ALIMENTATION",
        entityId: alimentationId,
        action: "REJETER",
        ancienStatut: alimentation.statut,
        nouveauStatut: "REJETE",
        userId,
        userRole,
        observations
      }
    });

    return {
      success: true,
      data: updatedAlimentation,
      message: "Alimentation rejetée"
    };
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    return { success: false, message: 'Erreur lors du rejet' };
  }
}

// Récupérer les alimentations selon le rôle utilisateur
export async function getAlimentations(userId: string, userRole: string, structureId?: string, ministereId?: string) {
  try {
    const whereClause: { structureId?: string; ministereId?: string } = {};

    // Filtrer selon le rôle
    switch (userRole) {
      case "Agent de saisie":
      case "Directeur":
        if (!structureId) {
          return { success: false, message: "Structure non définie" };
        }
        whereClause.structureId = structureId;
        break;
      case "Responsable Achats":
      case "Responsable achats":
      case "Directeur Financier":
      case "Directeur financier":
      case "Responsable financier":
      case "Ordonnateur":
        if (!ministereId) {
          return { success: false, message: "Ministère non défini" };
        }
        whereClause.ministereId = ministereId;
        break;
      case "Admin":
        // Admin peut voir toutes les alimentations, pas de filtre
        break;
      default:
        return { success: false, message: "Rôle non reconnu" };
    }

    const alimentations = await prisma.alimentation.findMany({
      where: whereClause,
      include: {
        produit: true,
        structure: {
          include: {
            ministere: true
          }
        },
        documents: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Récupérer l'historique manuellement pour chaque alimentation
    const alimentationsWithHistory = await Promise.all(
      alimentations.map(async (alimentation) => {
        const historiqueActions = await prisma.actionHistorique.findMany({
          where: {
            entityType: "ALIMENTATION",
            entityId: alimentation.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        });
        
        return {
          ...alimentation,
          historiqueActions
        };
      })
    );

    return {
      success: true,
      data: alimentationsWithHistory
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des alimentations:', error);
    return { success: false, message: 'Erreur lors de la récupération des alimentations' };
  }
}