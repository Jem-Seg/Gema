import prisma from '@/lib/prisma';

// Types pour les statuts d'octroi
export type OctroiStatus =
  | "SAISIE"
  | "INSTANCE_DIRECTEUR"
  | "VALIDE_DIRECTEUR"
  | "VALIDE_FINANCIER"
  | "INSTANCE_ORDONNATEUR"
  | "VALIDE_ORDONNATEUR"
  | "REJETE";

// Interface pour la création d'un octroi
export interface CreateOctroiData {
  produitId: string;
  quantite: number;
  beneficiaireNom: string;
  beneficiaireTelephone?: string;
  motif?: string;
  dateOctroi?: string;
  reference?: string;
  ministereId: string;
  structureId: string;
  createurId: string;
  userRole: string;
}

// Génération automatique du numéro d'octroi
async function generateOctroiNumber(ministereId: string, structureId: string): Promise<string> {
  // Récupérer les abréviations du ministère et de la structure
  const structure = await prisma.structure.findUnique({
    where: { id: structureId },
    include: { ministere: true }
  });

  if (!structure) {
    throw new Error('Structure non trouvée');
  }

  const ministereAbrev = structure.ministere.abreviation || 'MIN';
  const structureAbrev = structure.abreviation || 'STR';
  const year = new Date().getFullYear();

  // Format: OCT-[MINISTERE]-[STRUCTURE]-[ANNEE]-[NUMERO]
  const prefix = `OCT-${ministereAbrev}-${structureAbrev}-${year}-`;

  const lastOctroi = await prisma.octroi.findFirst({
    where: {
      numero: {
        startsWith: prefix
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastOctroi) {
    const parts = lastOctroi.numero.split('-');
    const lastNumber = parseInt(parts[parts.length - 1]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// Créer un nouveau octroi
export async function createOctroi(data: CreateOctroiData) {
  try {
    // Vérifier que le produit a suffisamment de stock
    const produit = await prisma.produit.findUnique({
      where: { id: data.produitId }
    });

    if (!produit) {
      return { success: false, message: "Produit non trouvé" };
    }

    if (produit.quantity < data.quantite) {
      return { success: false, message: `Stock insuffisant. Disponible: ${produit.quantity}` };
    }

    const numero = await generateOctroiNumber(data.ministereId, data.structureId);

    const octroi = await prisma.octroi.create({
      data: {
        numero,
        reference: data.reference || null,
        dateOctroi: data.dateOctroi ? new Date(data.dateOctroi) : new Date(),
        produitId: data.produitId,
        quantite: data.quantite,
        beneficiaireNom: data.beneficiaireNom,
        beneficiaireTelephone: data.beneficiaireTelephone,
        motif: data.motif,
        statut: "SAISIE",
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
        entityType: "OCTROI",
        entityId: octroi.id,
        action: "CREATION",
        ancienStatut: "",
        nouveauStatut: "SAISIE",
        userId: data.createurId,
        userRole: data.userRole
      }
    });

    return {
      success: true,
      data: octroi,
      message: `Octroi ${numero} créé avec succès`
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'octroi:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de l\'octroi'
    };
  }
}

// Mettre en instance un octroi
export async function instanceOctroi(
  octroiId: string,
  userId: string,
  userRole: string,
  observations?: string
) {
  try {
    const octroi = await prisma.octroi.findUnique({
      where: { id: octroiId },
      include: { produit: true }
    });

    if (!octroi) {
      return { success: false, message: "Octroi non trouvé" };
    }

    if (octroi.isLocked) {
      return { success: false, message: "Octroi verrouillé" };
    }

    // Déterminer le nouveau statut selon le rôle et le statut actuel
    let nouveauStatut: OctroiStatus;

    // Le directeur peut mettre en instance depuis SAISIE ou INSTANCE_DIRECTEUR (retour de l'ordonnateur)
    if (userRole === "Directeur" || userRole === "Directeur de la structure" || userRole === "Directeur de structure") {
      if (octroi.statut !== "SAISIE" && octroi.statut !== "INSTANCE_DIRECTEUR") {
        return { success: false, message: "Statut invalide pour cette action" };
      }
      nouveauStatut = "INSTANCE_DIRECTEUR";
    }
    // L'ordonnateur met en instance depuis VALIDE_FINANCIER
    else if (userRole === "Ordonnateur") {
      if (octroi.statut !== "VALIDE_FINANCIER") {
        return { success: false, message: "Statut invalide pour cette action" };
      }
      nouveauStatut = "INSTANCE_ORDONNATEUR";
    }
    else {
      return { success: false, message: "Rôle non autorisé pour cette action" };
    }

    // Mettre à jour l'octroi
    const updatedOctroi = await prisma.octroi.update({
      where: { id: octroiId },
      data: {
        statut: nouveauStatut,
        observations
      }
    });

    // Écrire dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: "OCTROI",
        entityId: octroiId,
        action: "INSTANCE",
        ancienStatut: octroi.statut,
        nouveauStatut,
        userId,
        userRole,
        observations
      }
    });

    return {
      success: true,
      data: updatedOctroi,
      message: `Octroi mis en instance. Il retourne au responsable des achats ou agent de saisie pour modification.`
    };
  } catch (error) {
    console.error('Erreur lors de la mise en instance:', error);
    return { success: false, message: 'Erreur lors de la mise en instance' };
  }
}

// Valider un octroi
export async function validateOctroi(
  octroiId: string,
  userId: string,
  userRole: string,
  observations?: string
) {
  try {
    const octroi = await prisma.octroi.findUnique({
      where: { id: octroiId },
      include: { produit: true }
    });

    if (!octroi) {
      return { success: false, message: "Octroi non trouvé" };
    }

    if (octroi.isLocked) {
      return { success: false, message: "Octroi verrouillé" };
    }

    // Déterminer le nouveau statut selon le rôle et le statut actuel
    let nouveauStatut: OctroiStatus;
    let shouldUpdateStock = false;

    if (userRole === "Directeur" || userRole === "Directeur de la structure" || userRole === "Directeur de structure") {
      // Le directeur valide depuis SAISIE ou INSTANCE_DIRECTEUR
      if (octroi.statut !== "SAISIE" && octroi.statut !== "INSTANCE_DIRECTEUR") {
        return { success: false, message: "Statut invalide pour cette action" };
      }
      nouveauStatut = "VALIDE_DIRECTEUR";
    }
    else if (userRole === "Directeur Financier" || userRole === "Responsable financier" || userRole === "Directeur financier") {
      // Le directeur financier valide depuis VALIDE_DIRECTEUR
      if (octroi.statut !== "VALIDE_DIRECTEUR") {
        return { success: false, message: "Statut invalide pour cette action" };
      }
      nouveauStatut = "VALIDE_FINANCIER";
    }
    else if (userRole === "Ordonnateur") {
      // L'ordonnateur valide depuis VALIDE_FINANCIER ou INSTANCE_ORDONNATEUR
      if (octroi.statut !== "VALIDE_FINANCIER" && octroi.statut !== "INSTANCE_ORDONNATEUR") {
        return { success: false, message: "Statut invalide pour cette action" };
      }
      nouveauStatut = "VALIDE_ORDONNATEUR";
      shouldUpdateStock = true; // C'est seulement à ce stade qu'on mouvemente le stock
    }
    else {
      return { success: false, message: "Rôle non autorisé pour cette action" };
    }

    // Vérifier le stock avant validation finale
    if (shouldUpdateStock && octroi.produit.quantity < octroi.quantite) {
      return {
        success: false,
        message: `Stock insuffisant. Disponible: ${octroi.produit.quantity}, Demandé: ${octroi.quantite}`
      };
    }

    // Transaction atomique pour mettre à jour l'octroi et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'octroi
      const updatedOctroi = await tx.octroi.update({
        where: { id: octroiId },
        data: {
          statut: nouveauStatut,
          observations,
          isLocked: shouldUpdateStock // Verrouiller si c'est la validation finale de l'ordonnateur
        }
      });

      // Si validation ordonnateur : mettre à jour le stock et créer la transaction
      if (shouldUpdateStock) {
        // Vérifier que le produit existe
        const produit = await tx.produit.findFirst({
          where: {
            id: octroi.produitId,
            structureId: octroi.structureId
          }
        });

        if (!produit) {
          throw new Error(`Produit avec l'ID ${octroi.produitId} non trouvé dans la structure`);
        }

        // Décrémenter le stock
        await tx.produit.update({
          where: { id: octroi.produitId },
          data: {
            quantity: {
              decrement: octroi.quantite
            }
          }
        });

        // Créer une transaction de sortie pour l'historique
        await tx.transaction.create({
          data: {
            type: "sortie",
            quantity: octroi.quantite,
            produitId: octroi.produitId,
            ministereId: octroi.ministereId,
            structureId: octroi.structureId,
            beneficiaireNom: octroi.beneficiaireNom,
            beneficiaireTelephone: octroi.beneficiaireTelephone
          }
        });
      }

      // Écrire dans l'historique
      await tx.actionHistorique.create({
        data: {
          entityType: "OCTROI",
          entityId: octroiId,
          action: "VALIDER",
          ancienStatut: octroi.statut,
          nouveauStatut,
          userId,
          userRole,
          observations
        }
      });

      return updatedOctroi;
    });

    let message = "";
    if (userRole === "Directeur" || userRole === "Directeur de la structure") {
      message = "Octroi validé. Il est transmis au directeur financier pour validation.";
    } else if (userRole === "Directeur Financier" || userRole === "Responsable financier" || userRole === "Directeur financier") {
      message = "Octroi validé. Il est transmis à l'ordonnateur pour validation finale.";
    } else if (userRole === "Ordonnateur") {
      message = `Octroi validé par l'ordonnateur. Stock mis à jour (-${octroi.quantite} ${octroi.produit.unit}). Transaction de sortie créée.`;
    }

    return {
      success: true,
      data: result,
      message
    };
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return { success: false, message: 'Erreur lors de la validation' };
  }
}

// Rejeter un octroi
export async function rejectOctroi(
  octroiId: string,
  userId: string,
  userRole: string,
  observations: string
) {
  try {
    const octroi = await prisma.octroi.findUnique({
      where: { id: octroiId }
    });

    if (!octroi) {
      return { success: false, message: "Octroi non trouvé" };
    }

    if (octroi.isLocked) {
      return { success: false, message: "Octroi verrouillé" };
    }

    // Seul l'ordonnateur peut rejeter
    if (userRole !== "Ordonnateur") {
      return { success: false, message: "Seul l'ordonnateur peut rejeter un octroi" };
    }

    // L'ordonnateur peut rejeter depuis VALIDE_FINANCIER ou INSTANCE_ORDONNATEUR
    if (octroi.statut !== "VALIDE_FINANCIER" && octroi.statut !== "INSTANCE_ORDONNATEUR") {
      return { success: false, message: "Statut invalide pour cette action" };
    }

    // Mettre à jour l'octroi avec statut REJETÉ
    // Important : pas de mouvement de stock lors d'un rejet
    const updatedOctroi = await prisma.octroi.update({
      where: { id: octroiId },
      data: {
        statut: "REJETE",
        observations,
        isLocked: true // Verrouiller après rejet, peut être supprimé par agent/responsable
      }
    });

    // Écrire dans l'historique
    await prisma.actionHistorique.create({
      data: {
        entityType: "OCTROI",
        entityId: octroiId,
        action: "REJETER",
        ancienStatut: octroi.statut,
        nouveauStatut: "REJETE",
        userId,
        userRole,
        observations
      }
    });

    return {
      success: true,
      data: updatedOctroi,
      message: "Octroi rejeté. Il retourne au responsable des achats ou agent de saisie. Aucun mouvement de stock n'a été effectué. L'octroi peut être supprimé définitivement."
    };
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    return { success: false, message: 'Erreur lors du rejet' };
  }
}

// Récupérer les octrois selon le rôle utilisateur
export async function getOctrois(userId: string, userRole: string, structureId?: string, ministereId?: string) {
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
        // Admin peut voir tous les octrois, pas de filtre
        break;
      default:
        return { success: false, message: "Rôle non reconnu" };
    }

    const octrois = await prisma.octroi.findMany({
      where: whereClause,
      include: {
        produit: {
          select: {
            id: true,
            name: true,
            unit: true,
            quantity: true,
            structureId: true
          }
        },
        structure: {
          include: {
            ministere: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Récupérer l'historique manuellement pour chaque octroi
    const octroiesWithHistory = await Promise.all(
      octrois.map(async (octroi) => {
        const historiqueActions = await prisma.actionHistorique.findMany({
          where: {
            entityType: "OCTROI",
            entityId: octroi.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        });

        const documents = await prisma.documentOctroi.findMany({
          where: {
            octroiId: octroi.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return {
          ...octroi,
          historiqueActions,
          documents
        };
      })
    );

    return {
      success: true,
      data: octroiesWithHistory
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des octrois:', error);
    return { success: false, message: 'Erreur lors de la récupération des octrois' };
  }
}
