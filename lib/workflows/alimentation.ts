import prisma from '@/lib/prisma';

// Types pour les statuts d'alimentation - WORKFLOW SIMPLIFIÉ
export type AlimentationStatus = 
  | "EN_ATTENTE"           // Création par Agent de saisie
  | "EN_INSTANCE_ACHATS"   // Responsable achats demande modifications
  | "VALIDE_ACHATS"        // Validé par Responsable achats → va au Responsable financier
  | "EN_INSTANCE_FINANCIER" // Responsable financier demande modifications
  | "VALIDE_FINANCIER"     // Validé par Responsable financier → va à l'Ordonnateur
  | "VALIDE_ORDONNATEUR"   // Validation finale + mise à jour stock
  | "REJETE";              // Rejeté par Ordonnateur

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
        statut: "EN_ATTENTE", // Création par Agent de saisie → en attente validation Responsable achats
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
        nouveauStatut: "EN_ATTENTE",
        userId: data.createurId,
        userRole: "Agent de saisie"
      }
    });

    return {
      success: true,
      data: alimentation,
      message: `Alimentation ${numero} créée avec succès et envoyée au Responsable achats`
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'alimentation:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de l\'alimentation'
    };
  }
}

// Mettre en instance une alimentation - WORKFLOW SIMPLIFIÉ
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
      case "Responsable Achats":
      case "Responsable achats":
        // Responsable achats peut mettre en instance seulement si EN_ATTENTE
        if (alimentation.statut !== "EN_ATTENTE") {
          return { success: false, message: "Vous ne pouvez mettre en instance que les alimentations en attente" };
        }
        nouveauStatut = "EN_INSTANCE_ACHATS"; // Retourne à l'Agent de saisie pour modifications
        break;
        
      case "Responsable Financier":
      case "Responsable financier":
        // Responsable financier peut mettre en instance seulement si VALIDE_ACHATS
        if (alimentation.statut !== "VALIDE_ACHATS") {
          return { success: false, message: "Vous ne pouvez mettre en instance que les alimentations validées par le Responsable achats" };
        }
        nouveauStatut = "EN_INSTANCE_FINANCIER"; // Retourne à l'Agent de saisie pour modifications
        break;
        
      default:
        return { success: false, message: "Votre rôle ne permet pas cette action" };
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
      message: `Alimentation renvoyée à l'Agent de saisie pour modifications`
    };
  } catch (error) {
    console.error('Erreur lors de la mise en instance:', error);
    return { success: false, message: 'Erreur lors de la mise en instance' };
  }
}

// Valider une alimentation - WORKFLOW SIMPLIFIÉ
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
      case "Responsable Achats":
      case "Responsable achats":
        // Peut valider si EN_ATTENTE ou EN_INSTANCE_ACHATS
        if (alimentation.statut !== "EN_ATTENTE" && alimentation.statut !== "EN_INSTANCE_ACHATS") {
          return { success: false, message: "Vous ne pouvez valider que les alimentations en attente ou en instance achats" };
        }
        nouveauStatut = "VALIDE_ACHATS"; // Passe au Responsable financier
        break;
        
      case "Responsable Financier":
      case "Responsable financier":
        // Peut valider si VALIDE_ACHATS ou EN_INSTANCE_FINANCIER
        if (alimentation.statut !== "VALIDE_ACHATS" && alimentation.statut !== "EN_INSTANCE_FINANCIER") {
          return { success: false, message: "Vous ne pouvez valider que les alimentations validées par le Responsable achats ou en instance financier" };
        }
        nouveauStatut = "VALIDE_FINANCIER"; // Passe à l'Ordonnateur
        break;
        
      case "Ordonnateur":
        // Peut valider si VALIDE_FINANCIER
        if (alimentation.statut !== "VALIDE_FINANCIER") {
          return { success: false, message: "Vous ne pouvez valider que les alimentations validées par le Responsable financier" };
        }
        nouveauStatut = "VALIDE_ORDONNATEUR"; // Validation finale
        shouldUpdateStock = true; // Mise à jour du stock
        break;
        
      default:
        return { success: false, message: "Votre rôle ne permet pas cette action" };
    }

    // Transaction atomique pour mettre à jour l'alimentation et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'alimentation
      const updatedAlimentation = await tx.alimentation.update({
        where: { id: alimentationId },
        data: {
          statut: nouveauStatut,
          observations,
          isLocked: shouldUpdateStock // Verrouiller si validation finale
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
            price: alimentation.prixUnitaire
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
            alimentationId: alimentation.id
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
        : `Alimentation validée et envoyée à l'étape suivante`
    };
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return { success: false, message: 'Erreur lors de la validation' };
  }
}

// Rejeter une alimentation - WORKFLOW SIMPLIFIÉ
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

    if (alimentation.statut !== "VALIDE_FINANCIER") {
      return { success: false, message: "Vous ne pouvez rejeter que les alimentations validées par le Responsable financier" };
    }

    // Mettre à jour l'alimentation
    const updatedAlimentation = await prisma.alimentation.update({
      where: { id: alimentationId },
      data: {
        statut: "REJETE",
        observations
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

// Récupérer les alimentations selon le rôle utilisateur - WORKFLOW SIMPLIFIÉ
export async function getAlimentations(userId: string, userRole: string, structureId?: string, ministereId?: string) {
  try {
    const whereClause: { structureId?: string; ministereId?: string } = {};

    // Filtrer selon le rôle
    switch (userRole) {
      case "Agent de saisie":
        // Agent de saisie voit toutes les alimentations de son ministère (peut intervenir sur toutes les structures)
        if (!ministereId) {
          return { success: false, message: "Ministère non défini" };
        }
        whereClause.ministereId = ministereId;
        break;
      case "Responsable Achats":
      case "Responsable achats":
      case "Responsable Financier":
      case "Responsable financier":
      case "Ordonnateur":
        if (!ministereId) {
          return { success: false, message: "Ministère non défini" };
        }
        whereClause.ministereId = ministereId;
        break;
      case "Admin":
        // Admin peut voir toutes les alimentations
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