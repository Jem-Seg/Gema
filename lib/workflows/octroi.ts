import prisma from '@/lib/prisma';

// Types pour les statuts d'octroi - WORKFLOW SIMPLIFIÉ
export type OctroiStatus =
  | "EN_ATTENTE"           // Création par Agent de saisie
  | "EN_INSTANCE_ACHATS"   // Responsable achats demande modifications
  | "VALIDE_ACHATS"        // Validé par Responsable achats → va au Responsable financier
  | "EN_INSTANCE_FINANCIER" // Responsable financier demande modifications  
  | "VALIDE_FINANCIER"     // Validé par Responsable financier → va à l'Ordonnateur
  | "VALIDE_ORDONNATEUR"   // Validation finale + mise à jour stock
  | "REJETE";              // Rejeté par Ordonnateur

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
        statut: "EN_ATTENTE",
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
        nouveauStatut: "EN_ATTENTE",
        userId: data.createurId,
        userRole: data.userRole
      }
    });

    return {
      success: true,
      data: octroi,
      message: `Octroi ${numero} créé avec succès et envoyé au Responsable achats`
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'octroi:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de l\'octroi'
    };
  }
}

// Mettre en instance un octroi - WORKFLOW SIMPLIFIÉ
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

    // Déterminer le nouveau statut selon le rôle
    let nouveauStatut: OctroiStatus;
    
    switch (userRole) {
      case "Responsable Achats":
      case "Responsable achats":
        // Responsable achats peut mettre en instance seulement si EN_ATTENTE
        if (octroi.statut !== "EN_ATTENTE") {
          return { success: false, message: "Vous ne pouvez mettre en instance que les octrois en attente" };
        }
        nouveauStatut = "EN_INSTANCE_ACHATS"; // Retourne à l'Agent de saisie pour modifications
        break;
        
      case "Responsable Financier":
      case "Responsable financier":
        // Responsable financier peut mettre en instance seulement si VALIDE_ACHATS
        if (octroi.statut !== "VALIDE_ACHATS") {
          return { success: false, message: "Vous ne pouvez mettre en instance que les octrois validés par le Responsable achats" };
        }
        nouveauStatut = "EN_INSTANCE_FINANCIER"; // Retourne à l'Agent de saisie pour modifications
        break;
        
      default:
        return { success: false, message: "Votre rôle ne permet pas cette action" };
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
      message: `Octroi renvoyé à l'Agent de saisie pour modifications`
    };
  } catch (error) {
    console.error('Erreur lors de la mise en instance:', error);
    return { success: false, message: 'Erreur lors de la mise en instance' };
  }
}

// Valider un octroi - WORKFLOW SIMPLIFIÉ
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

    // Déterminer le nouveau statut selon le rôle
    let nouveauStatut: OctroiStatus;
    let shouldUpdateStock = false;

    switch (userRole) {
      case "Responsable Achats":
      case "Responsable achats":
        // Peut valider si EN_ATTENTE ou EN_INSTANCE_ACHATS
        if (octroi.statut !== "EN_ATTENTE" && octroi.statut !== "EN_INSTANCE_ACHATS") {
          return { success: false, message: "Vous ne pouvez valider que les octrois en attente ou en instance achats" };
        }
        nouveauStatut = "VALIDE_ACHATS"; // Passe au Responsable financier
        break;
        
      case "Responsable Financier":
      case "Responsable financier":
        // Peut valider si VALIDE_ACHATS ou EN_INSTANCE_FINANCIER
        if (octroi.statut !== "VALIDE_ACHATS" && octroi.statut !== "EN_INSTANCE_FINANCIER") {
          return { success: false, message: "Vous ne pouvez valider que les octrois validés par le Responsable achats ou en instance financier" };
        }
        nouveauStatut = "VALIDE_FINANCIER"; // Passe à l'Ordonnateur
        break;
        
      case "Ordonnateur":
        // Peut valider si VALIDE_FINANCIER
        if (octroi.statut !== "VALIDE_FINANCIER") {
          return { success: false, message: "Vous ne pouvez valider que les octrois validés par le Responsable financier" };
        }
        
        // Vérifier le stock avant validation finale
        if (octroi.produit.quantity < octroi.quantite) {
          return {
            success: false,
            message: `Stock insuffisant. Disponible: ${octroi.produit.quantity}, Demandé: ${octroi.quantite}`
          };
        }
        
        nouveauStatut = "VALIDE_ORDONNATEUR"; // Validation finale
        shouldUpdateStock = true; // Mise à jour du stock
        break;
        
      default:
        return { success: false, message: "Votre rôle ne permet pas cette action" };
    }

    // Transaction atomique pour mettre à jour l'octroi et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'octroi
      const updatedOctroi = await tx.octroi.update({
        where: { id: octroiId },
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

    return {
      success: true,
      data: result,
      message: shouldUpdateStock 
        ? `Octroi validé et stock mis à jour (-${octroi.quantite} ${octroi.produit.unit})`
        : `Octroi validé et envoyé à l'étape suivante`
    };
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return { success: false, message: 'Erreur lors de la validation' };
  }
}

// Rejeter un octroi - WORKFLOW SIMPLIFIÉ
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

    // L'ordonnateur peut rejeter seulement si VALIDE_FINANCIER
    if (octroi.statut !== "VALIDE_FINANCIER") {
      return { success: false, message: "Vous ne pouvez rejeter que les octrois validés par le Responsable financier" };
    }

    // Mettre à jour l'octroi avec statut REJETÉ
    const updatedOctroi = await prisma.octroi.update({
      where: { id: octroiId },
      data: {
        statut: "REJETE",
        observations
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
      message: "Octroi rejeté"
    };
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    return { success: false, message: 'Erreur lors du rejet' };
  }
}

// Récupérer les octrois selon le rôle utilisateur - WORKFLOW SIMPLIFIÉ
export async function getOctrois(userId: string, userRole: string, structureId?: string, ministereId?: string) {
  try {
    const whereClause: { structureId?: string; ministereId?: string } = {};

    // Filtrer selon le rôle
    switch (userRole) {
      case "Agent de saisie":
        // Agent de saisie voit tous les octrois de son ministère (peut intervenir sur toutes les structures)
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
        // Admin peut voir tous les octrois
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
