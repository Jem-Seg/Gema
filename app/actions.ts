"use server";
import prisma from '@/lib/prisma';
import { formDataType, OrderItem, ProductOverviewStats, Produit, StockSummary, Transaction, StructureStatistics, ProductStatistics } from '@/type';
import { Category } from '@prisma/client';
/**
 * Vérifie si un utilisateur peut créer/modifier/supprimer des catégories et produits
 * WORKFLOW SIMPLIFIÉ:
 * - Admin : tous les droits
 * - Agent de saisie : toutes les structures de son ministère
 * - Responsable Achats : toutes les structures de son ministère
 * - Autres rôles : pas de gestion des catégories/produits
 */
async function canManageCategoriesInStructure(userId: string, structureId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user || !user.isApproved) return false;

    // Admin a tous les droits
    if (user.isAdmin) return true;

    // Récupérer la structure cible
    const targetStructure = await prisma.structure.findUnique({
      where: { id: structureId },
      include: { ministere: true }
    });

    if (!targetStructure) return false;

    // Agent de saisie et Responsable Achats : toutes les structures de leur ministère
    if (user.role?.name === "Agent de saisie" || user.role?.name === "Responsable Achats" || user.role?.name === "Responsable achats") {
      return user.ministereId === targetStructure.ministereId;
    }

    return false;
  } catch (error) {
    console.error('Erreur vérification permissions gestion:', error);
    return false;
  }
}



/**
 * Vérifie si un utilisateur existe déjà dans la base de données
 * @param userId - L'ID Clerk de l'utilisateur à vérifier
 * @param email - L'email de l'utilisateur (optionnel, pour vérification alternative)
 * @returns Promise<boolean> - true si l'utilisateur existe, false sinon
 */

export async function checkAndAddUser(userId: string, email?: string) {
  if (!email) return
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          ...(email ? [{ email }] : [])
        ]
      }
    });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name: '',
          firstName: '',
          isApproved: false,
          password: "",
          isAdmin: false
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification d\'existence utilisateur:', error);
  }
}
/**
 * Récupère de manière simple un ministère et une structure spécifique rattachée.
 * Retourne null si la structure n'existe pas ou n'appartient pas au ministère.
 * Si ministereId est omis, retourne la structure avec son ministère sans validation
 */
export async function getMinistereAndStructure(ministereId?: string, structureId?: string) {
  if (!structureId) return null;

  try {
    // On récupère la structure avec son ministère (relation incluse)
    const structure = await prisma.structure.findUnique({
      where: { id: structureId },
      include: { ministere: true }
    });

    if (!structure) {
      return null;
    }

    // Si un ministereId est fourni, vérifier l'appartenance
    if (ministereId && structure.ministere.id !== ministereId) {
      return null;
    }

    return structure;
  } catch (error) {
    console.error('Erreur lors de la récupération ministère+structure:', error);
    return null;
  }
}
export async function createCategory(
  name: string,
  structureId: string,
  userId: string,
  description?: string
) {
  if (!name || !userId) return;

  try {
    // Vérifier les permissions pour cette structure
    const hasPermission = await canManageCategoriesInStructure(userId, structureId);
    if (!hasPermission) {
      throw new Error('Permission refusée. Vous ne pouvez créer des catégories que dans les structures autorisées selon votre rôle.');
    }

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description: description || "",
        structureId: structure.id,
        ministereId: structure.ministere.id
      }
    });
    return newCategory;
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    throw error;
  }
}

export async function updateCategory(
  id: string,
  name: string,
  structureId: string,
  userId: string,
  description?: string
) {
  if (!id || !name || !structureId || !userId) {
    throw new Error('ID, nom, ID de structure et ID utilisateur sont requis pour la mise à jour');
  }

  try {
    // Vérifier les permissions pour cette structure
    const hasPermission = await canManageCategoriesInStructure(userId, structureId);
    if (!hasPermission) {
      throw new Error('Permission refusée. Vous ne pouvez modifier des catégories que dans les structures autorisées selon votre rôle.');
    }

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description: description || "",
        structureId: structure.id,
        ministereId: structure.ministere.id
      }
    });
    return updatedCategory;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    throw error;
  }
}
export async function deleteCategory(id: string, structureId: string, userId: string) {
  if (!id || !structureId || !userId) {
    throw new Error('ID, ID de structure et ID utilisateur sont requis pour la suppression');
  }

  try {
    // Vérifier les permissions pour cette structure
    const hasPermission = await canManageCategoriesInStructure(userId, structureId);
    if (!hasPermission) {
      throw new Error('Permission refusée. Vous ne pouvez supprimer des catégories que dans les structures autorisées selon votre rôle.');
    }

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    const deletedCategory = await prisma.category.delete({
      where: {
        id: id,
        structureId: structureId
      },
    });
    return deletedCategory;
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    throw error;
  }
}

/**
 * Récupère tous les ministères avec leurs structures
 */
export async function getAllMinisteresWithStructures() {
  try {
    const ministeres = await prisma.ministere.findMany({
      include: {
        structures: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    return ministeres;
  } catch (error) {
    console.error('Erreur lors de la récupération des ministères:', error);
    return [];
  }
}

/**
 * Récupère toutes les catégories avec leurs relations (filtrées par ministère pour les utilisateurs)
 */
export async function getAllCategoriesWithDetails(userId?: string) {
  try {
    // Si pas de userId (utilisation publique), retourner un tableau vide
    if (!userId) {
      return [];
    }

    // Vérifier si l'utilisateur est admin (peut voir toutes les catégories)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    });

    if (!user || !user.isApproved) {
      throw new Error('Utilisateur non approuvé ou introuvable');
    }

    // Si admin, retourner toutes les catégories
    if (user.isAdmin) {
      const categories = await prisma.category.findMany({
        include: {
          structure: {
            include: {
              ministere: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      return categories;
    }

    // Déterminer le filtre selon le rôle de l'utilisateur
    let whereClause: any;

    // Directeur : seulement sa propre structure
    if (user.role?.name === "Directeur" && user.structureId) {
      whereClause = { structureId: user.structureId };
    }
    // Agent de saisie : seulement sa propre structure
    else if (user.role?.name === "Agent de saisie" && user.structureId) {
      whereClause = { structureId: user.structureId };
    }
    // Responsable Achats, Directeur Financier, Responsable financier, Ordonnateur : tout le ministère
    else if (
      (user.role?.name === "Responsable Achats" ||
        user.role?.name === "Responsable achats" ||
        user.role?.name === "Directeur Financier" ||
        user.role?.name === "Directeur financier" ||
        user.role?.name === "Responsable financier" ||
        user.role?.name === "Ordonnateur") &&
      user.ministereId
    ) {
      whereClause = { 
        structure: {
          ministereId: user.ministereId
        }
      };
    }
    // Si l'utilisateur n'a pas de rôle reconnu ou pas de rattachement
    else {
      throw new Error('Permissions insuffisantes pour consulter les catégories');
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        structure: {
          include: {
            ministere: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return [];
  }
}

/**
 * Récupère les structures du ministère de l'utilisateur connecté
 */
export async function getUserMinistereStructures(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        ministere: {
          include: {
            structures: true
          }
        }
      }
    });

    if (!user || !user.isApproved) {
      console.warn('Utilisateur non approuvé ou introuvable pour userId:', userId);
      return [];
    }

    // Si admin, retourner toutes les structures de tous les ministères
    if (user.isAdmin) {
      const allMinisteres = await prisma.ministere.findMany({
        include: {
          structures: true
        },
        orderBy: { name: 'asc' }
      });
      return allMinisteres;
    }

    // Agent de saisie : seulement sa propre structure
    if (user.role?.name === "Agent de saisie" && user.structureId) {
      const structure = await prisma.structure.findUnique({
        where: { id: user.structureId },
        include: { ministere: true }
      });

      if (!structure) {
        throw new Error('Structure de l\'utilisateur introuvable');
      }

      return [{
        ...structure.ministere,
        structures: [structure]
      }];
    }

    // Responsable Achats : toutes les structures de son ministère
    if (user.role?.name === "Responsable Achats" || user.role?.name === "Responsable achats") {
      if (!user.ministereId) {
        throw new Error('Utilisateur Responsable Achats non rattaché à un ministère');
      }

      const ministere = await prisma.ministere.findUnique({
        where: { id: user.ministereId },
        include: {
          structures: {
            orderBy: { name: 'asc' }
          }
        }
      });

      if (!ministere) {
        throw new Error('Ministère introuvable');
      }

      return [ministere];
    }

    // Responsable Financier : Accès à toutes les structures de son ministère
    if (user.role?.name === "Responsable Financier" || user.role?.name === "Responsable financier") {
      if (!user.ministereId) {
        throw new Error('Utilisateur Responsable Financier non rattaché à un ministère');
      }

      const ministere = await prisma.ministere.findUnique({
        where: { id: user.ministereId },
        include: {
          structures: {
            orderBy: { name: 'asc' }
          }
        }
      });

      if (!ministere) {
        throw new Error('Ministère introuvable');
      }

      return [ministere];
    }

    // Directeur Financier : Accès à toutes les structures de son ministère
    if (user.role?.name === "Directeur Financier" || user.role?.name === "Directeur financier") {
      if (!user.ministereId) {
        throw new Error('Utilisateur Directeur Financier non rattaché à un ministère');
      }

      const ministere = await prisma.ministere.findUnique({
        where: { id: user.ministereId },
        include: {
          structures: {
            orderBy: { name: 'asc' }
          }
        }
      });

      if (!ministere) {
        throw new Error('Ministère introuvable');
      }

      return [ministere];
    }

    // Ordonnateur : Accès à toutes les structures de son ministère
    if (user.role?.name === "Ordonnateur") {
      if (!user.ministereId) {
        throw new Error('Utilisateur Ordonnateur non rattaché à un ministère');
      }

      const ministere = await prisma.ministere.findUnique({
        where: { id: user.ministereId },
        include: {
          structures: {
            orderBy: { name: 'asc' }
          }
        }
      });

      if (!ministere) {
        throw new Error('Ministère introuvable');
      }

      return [ministere];
    }

    // Directeur : Accès à la structure à laquelle il est rattaché dans son ministère
    if (user.role?.name === "Directeur" && user.structureId) {
      const structure = await prisma.structure.findUnique({
        where: { id: user.structureId },
        include: { ministere: true }
      });

      if (!structure) {
        throw new Error('Structure du directeur introuvable');
      }

      return [{
        ...structure.ministere,
        structures: [structure]
      }];
    }

    // Rôles non reconnus ou utilisateurs sans permissions spéciales
    console.warn('Rôle utilisateur non reconnu ou sans permissions spéciales pour userId:', userId);
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des structures utilisateur:', error);
    return [];
  }
}

/**
 * Récupère les informations sur les permissions de l'utilisateur pour affichage dans l'interface
 */
export async function getUserPermissionsInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        structure: true,
        ministere: true
      }
    });

    if (!user || !user.isApproved) {
      return {
        canCreate: false,
        canRead: false,
        scope: 'none',
        message: 'Utilisateur non approuvé ou introuvable'
      };
    }

    if (user.isAdmin) {
      return {
        canCreate: true,
        canRead: true,
        scope: 'all',
        message: 'Admin : Tous les droits sur toutes les structures'
      };
    }

    const roleName = user.role?.name?.trim();

    switch (roleName) {
      case "Agent de saisie":
        if (!user.structureId) {
          return {
            canCreate: false,
            canRead: false,
            scope: 'none',
            message: 'Agent de saisie : Aucune structure assignée. Contactez un administrateur.'
          };
        }
        return {
          canCreate: true,
          canRead: true,
          scope: 'structure',
          message: `Agent de saisie : Création/modification/suppression et lecture des catégories de votre structure (${user.structure?.name || 'Non assignée'})`
        };

      case "Directeur":
        if (!user.structureId) {
          return {
            canCreate: false,
            canRead: false,
            scope: 'none',
            message: 'Directeur : Aucune structure assignée. Contactez un administrateur.'
          };
        }
        return {
          canCreate: false,
          canRead: true,
          scope: 'structure',
          message: `Directeur : Lecture seule des catégories de votre structure (${user.structure?.name || 'Non assignée'})`
        };

      case "Responsable Achats":
      case "Responsable achats":
        if (!user.ministereId) {
          return {
            canCreate: false,
            canRead: false,
            scope: 'none',
            message: 'Responsable Achats : Aucun ministère assigné. Contactez un administrateur.'
          };
        }
        return {
          canCreate: true,
          canRead: true,
          scope: 'ministere',
          message: `Responsable Achats : Création/modification/suppression et lecture des produits de votre ministère (${user.ministere?.name || 'Non assigné'})`
        };

      case "Directeur Financier":
      case "Directeur financier":
      case "Responsable Financier":
      case "Responsable financier":
      case "Ordonnateur":
        if (!user.ministereId) {
          return {
            canCreate: false,
            canRead: false,
            scope: 'none',
            message: `${roleName} : Aucun ministère assigné. Contactez un administrateur.`
          };
        }
        return {
          canCreate: false,
          canRead: true,
          scope: 'ministere',
          message: `${roleName} : Lecture seule des produits de votre ministère (${user.ministere?.name || 'Non assigné'})`
        };

      default:
        console.error('Rôle utilisateur non reconnu ou sans permissions spéciales pour userId:', userId);
        console.error('Nom du rôle reçu:', user.role?.name);
        return {
          canCreate: false,
          canRead: false,
          scope: 'none',
          message: `Rôle "${user.role?.name || 'Non défini'}" non reconnu. Contactez un administrateur.`
        };
    }
  } catch (error) {
    console.error('Erreur récupération infos permissions:', error);
    return {
      canCreate: false,
      canRead: false,
      scope: 'none',
      message: 'Erreur lors de la récupération des permissions'
    };
  }
}

export async function readCategory(structureId: string) {
  if (!structureId) {
    throw new Error('ID de structure est requis pour la lecture');
  }
  try {
    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }
    const category = await prisma.category.findMany({
      where: {
        structureId: structureId
      },
    });
    return category;
  } catch (error) {
    console.error('Erreur lors de la lecture de la catégorie:', error);
  }
}

export async function createProduct(formData: formDataType, structureId: string, userId?: string) {
  try {
    const { name, description, price, imageUrl, categoryId, quantity, unit } = formData;
    if (!name || !structureId || !categoryId) {
      throw new Error('Le nom, la catégorie et la structure sont requis pour créer un produit');
    }

    // Vérifier les permissions si userId est fourni
    if (userId) {
      const canModify = await canUserModifyProducts(userId, structureId);
      if (!canModify) {
        throw new Error('Permissions insuffisantes pour créer un produit dans cette structure');
      }
    }
    const safeImageUrl = imageUrl || '';
    const safeUnit = unit || '';

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    // Valider que la catégorie existe et appartient au même ministère
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new Error('Catégorie non trouvée');
    }

    if (category.ministereId !== structure.ministere.id) {
      throw new Error('La catégorie doit appartenir au même ministère que le produit');
    }

    const newProduct = await prisma.produit.create({
      data: {
        name,
        description: description || "",
        price: price ? Number(price) : null,
        imageUrl: safeImageUrl,
        categoryId,
        quantity: Number(quantity) || 0,
        unit: safeUnit,
        structureId: structure.id,
        ministereId: structure.ministere.id
      }
    });
    return newProduct;
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    throw error;
  }
}

export async function updateProduct(productId: string, formData: formDataType, userId?: string) {
  try {
    const { name, description, price, imageUrl, categoryId, quantity, unit } = formData;

    if (!productId || !name || !categoryId) {
      throw new Error('L\'ID, le nom et la catégorie sont requis pour mettre à jour un produit');
    }

    // Récupérer le produit existant
    const existingProduct = await prisma.produit.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw new Error('Produit non trouvé');
    }

    // Vérifier les permissions si userId est fourni
    if (userId) {
      const canModify = await canUserModifyProducts(userId, existingProduct.structureId);
      if (!canModify) {
        throw new Error('Permissions insuffisantes pour modifier ce produit');
      }
    }

    // Valider que la catégorie existe et appartient au même ministère
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { structure: { include: { ministere: true } } }
    });

    if (!category) {
      throw new Error('Catégorie non trouvée');
    }

    if (category.ministereId !== existingProduct.ministereId) {
      throw new Error('La catégorie doit appartenir au même ministère que le produit');
    }

    const safeImageUrl = imageUrl || existingProduct.imageUrl;
    const safeUnit = unit || existingProduct.unit;
    const safeQuantity = quantity !== undefined ? quantity : existingProduct.quantity;
    const safePrice = price !== undefined ? Number(price) : existingProduct.price;

    const updatedProduct = await prisma.produit.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: safePrice,
        imageUrl: safeImageUrl,
        categoryId,
        quantity: Number(safeQuantity),
        unit: safeUnit,
        updatedAt: new Date()
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    });

    return {
      ...updatedProduct,
      categoryName: updatedProduct.category.name
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    throw error;
  }
}

/**
 * Vérifie si un utilisateur peut modifier/supprimer des produits
 * Seuls les Agents de saisie et Responsables Achats le peuvent
 */
export async function canUserModifyProducts(userId: string, productStructureId?: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        structure: true,
        ministere: true
      }
    });

    if (!user || !user.isApproved) {
      return false;
    }

    if (user.isAdmin) {
      return true;
    }

    // Agent de saisie : peut modifier seulement dans sa structure
    if (user.role?.name === "Agent de saisie") {
      return user.structureId === productStructureId;
    }

    // Responsable Achats : peut modifier dans toutes les structures de son ministère
    if (user.role?.name === "Responsable Achats" || user.role?.name === "Responsable achats") {
      if (!productStructureId) return true; // Pour les créations

      // Vérifier que la structure du produit appartient au même ministère
      const productStructure = await prisma.structure.findUnique({
        where: { id: productStructureId },
        select: { ministereId: true }
      });

      return productStructure?.ministereId === user.ministereId;
    }

    // Tous les autres rôles (Directeur Financier, Ordonnateur, Directeur) ne peuvent pas modifier
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

export async function deleteProduct(id: string, structureId: string, userId?: string) {
  try {
    if (!id || !structureId) {
      throw new Error('L\'ID et la structure sont requis pour supprimer un produit');
    }

    // Vérifier les permissions si userId est fourni
    if (userId) {
      const canModify = await canUserModifyProducts(userId, structureId);
      if (!canModify) {
        throw new Error('Permissions insuffisantes pour supprimer ce produit');
      }
    }

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    // Vérifier d'abord si le produit existe
    const existingProduct = await prisma.produit.findFirst({
      where: {
        id: id,
        structureId: structureId
      }
    });

    if (!existingProduct) {
      throw new Error('Produit non trouvé ou n\'appartient pas à cette structure');
    }

    // Utiliser delete au lieu de deleteMany pour plus de précision
    const deletedProduct = await prisma.produit.delete({
      where: {
        id: id
      },
    });
    return deletedProduct;
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    throw error;
  }
}

export async function readProduct(structureId: string): Promise<Produit[]> {
  try {
    if (!structureId) {
      throw new Error('structureId est requis');
    }

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    const products = await prisma.produit.findMany({
      where: { structureId: structureId },
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return products.map(product => ({
      ...product,
      categoryName: product.category.name
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    throw error;
  }
}

/**
 * Récupère tous les produits selon les permissions de l'utilisateur
 * - Admin : tous les produits
 * - Agent de saisie/Directeur : seulement les produits de leur structure
 * - Responsable Achats/Directeur Financier/Ordonnateur : tous les produits de leur ministère
 */
/**
 * Récupère un produit par son ID avec vérification des permissions
 */
export async function getProductById(productId: string, userId?: string): Promise<Produit | null> {
  try {
    if (!productId) {
      throw new Error('ID du produit requis');
    }

    const product = await prisma.produit.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            name: true
          }
        },
        structure: {
          include: {
            ministere: true
          }
        }
      }
    });

    if (!product) {
      return null;
    }

    // Si userId est fourni, vérifier les permissions
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          structure: true,
          ministere: true
        }
      });

      if (!user || !user.isApproved) {
        throw new Error('Utilisateur non approuvé ou introuvable');
      }

      // Admin peut voir tous les produits
      if (!user.isAdmin) {
        // Agent de saisie et Directeur : seulement leur structure
        if ((user.role?.name === "Agent de saisie" || user.role?.name === "Directeur") &&
          user.structureId !== product.structureId) {
          throw new Error('Permissions insuffisantes pour consulter ce produit');
        }

        // Responsable Achats, Directeur Financier, Ordonnateur : seulement leur ministère
        if ((user.role?.name === "Responsable Achats" ||
             user.role?.name === "Responsable achats" ||
          user.role?.name === "Directeur Financier" ||
          user.role?.name === "Ordonnateur") &&
          user.ministereId !== product.ministereId) {
          throw new Error('Permissions insuffisantes pour consulter ce produit');
        }
      }
    }

    return {
      ...product,
      categoryName: product.category.name
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    throw error;
  }
}

export async function getAllProductsWithDetails(userId?: string): Promise<Produit[]> {
  try {
    // Si pas de userId (utilisation publique), retourner un tableau vide
    if (!userId) {
      return [];
    }

    // Vérifier si l'utilisateur est admin (peut voir tous les produits)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    });

    if (!user || !user.isApproved) {
      throw new Error('Utilisateur non approuvé ou introuvable');
    }

    // Si admin, retourner tous les produits
    if (user.isAdmin) {
      const products = await prisma.produit.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          },
          structure: {
            include: {
              ministere: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      return products.map(product => ({
        ...product,
        categoryName: product.category.name
      }));
    }

    // Déterminer le filtre selon le rôle de l'utilisateur
    let whereClause: any;

    // Directeur : seulement sa propre structure
    if (user.role?.name === "Directeur" && user.structureId) {
      whereClause = { structureId: user.structureId };
    }
    // Agent de saisie : seulement sa propre structure
    else if (user.role?.name === "Agent de saisie" && user.structureId) {
      whereClause = { structureId: user.structureId };
    }
    // Responsable Achats, Directeur Financier, Ordonnateur : tout le ministère
    else if (
      (user.role?.name === "Responsable Achats" ||
        user.role?.name === "Responsable achats" ||
        user.role?.name === "Directeur Financier" ||
        user.role?.name === "Directeur financier" ||
        user.role?.name === "Responsable financier" ||
        user.role?.name === "Ordonnateur") &&
      user.ministereId
    ) {
      whereClause = { 
        structure: {
          ministereId: user.ministereId
        }
      };
    }
    // Si l'utilisateur n'a pas de rôle reconnu ou pas de rattachement
    else {
      throw new Error('Permissions insuffisantes pour consulter les produits');
    }

    const products = await prisma.produit.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true
          }
        },
        structure: {
          include: {
            ministere: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return products.map(product => ({
      ...product,
      categoryName: product.category.name
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }
}

export async function readProductById(productId: string, structureId: string): Promise<Produit | undefined> {
  try {
    if (!structureId) {
      throw new Error('L\'ID et la structure est requis pour lire un produit');
    }
    const product = await prisma.produit.findUnique({
      where: {
        id: productId,
        structureId: structureId
      },
      include: {
        category: true
      }
    });
    if (!product) {
      return undefined;
    }
    return {
      ...product,
      categoryName: (product.category as Category).name
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du produit:', error);
    throw error;
  }
}

export async function replenishStockWithTransaction(productId: string, quantity: number, structureId: string) {
  try {

    if (quantity <= 0) {
      throw new Error('La quantité à ajouter doit être supérieure à zéro');
    }

    if (!structureId) {
      throw new Error('L\'ID et la structure est requis pour lire un produit');
    }

    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }

    // Vérifier que le produit existe avant de le mettre à jour
    const existingProduct = await prisma.produit.findFirst({
      where: {
        id: productId,
        structureId: structureId
      }
    });

    if (!existingProduct) {
      throw new Error(`Produit avec l'ID ${productId} non trouvé dans la structure ${structureId}`);
    }

    await prisma.produit.update({
      where: {
        id: productId
      },
      data: {
        quantity: {
          increment: quantity
        }
      }
    });
    await prisma.transaction.create({
      data: {
        type: "IN",
        quantity: quantity,
        produitId: productId,
        structureId: structureId,
        ministereId: structure.ministere.id
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock avec transaction:', error);
    throw error;
  }
}
export async function deductStockWithTransaction(orderItems: OrderItem[], structureId: string) {
  try {

    if (!structureId) {
      throw new Error('L\'ID et la structure est requis pour lire un produit');
    }
    const structure = await getMinistereAndStructure('', structureId);
    if (!structure) {
      throw new Error('Structure introuvable ou non rattachée au ministère');
    }
    for (const item of orderItems) {
      const product = await prisma.produit.findUnique({
        where: { id: item.productId }
      })
      if (!product) {
        throw new Error(`Produit avec l'ID ${item.productId} non trouvé`);
      }
      if (item.quantity <= 0) {
        throw new Error(`La quantité à déduire pour le produit ${product.name} doit être supérieure à zéro`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Stock insuffisant pour le produit ${product.name}. Stock actuel: ${product.quantity}, Quantité demandée: ${item.quantity}`);
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        await tx.produit.update({
          where: {
            id: item.productId
          },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
        await tx.transaction.create({
          data: {
            type: "OUT",
            quantity: item.quantity,
            produitId: item.productId,
            structureId: structureId,
            ministereId: structure.ministere.id
          }
        })
      }
    })
    return { success: true, message: 'Stock mis à jour avec succès' };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock avec transaction:', error);
    return { success: false, message: (error as Error).message };
  }
}

// Fonction qui permet de récuperer les transactions d'une structure
export async function getTransactions(userId: string, structureId?: string, limit?: number): Promise<Transaction[]> {
  try {
    if (!userId) {
      throw new Error('L\'ID utilisateur Clerk est requis');
    }

    // Vérifier les permissions utilisateur et récupérer les structures accessibles
    const userStructures = await getUserMinistereStructures(userId);

    if (!userStructures || userStructures.length === 0) {
      console.warn('Aucune structure accessible pour cet utilisateur');
      return [];
    }

    // Déterminer les structures cibles
    let whereClause: { structureId?: string | { in: string[] } } = {};

    if (structureId && structureId.trim() !== '') {
      // Structure spécifique sélectionnée
      const hasAccess = userStructures.some(ministere =>
        ministere.structures?.some(structure => structure.id === structureId)
      );

      if (!hasAccess) {
        throw new Error('Accès non autorisé à cette structure');
      }

      whereClause = { structureId: structureId };
    } else {
      // "Toutes les structures" - récupérer les IDs de toutes les structures accessibles
      const accessibleStructureIds: string[] = [];
      userStructures.forEach(ministere => {
        if (ministere.structures) {
          ministere.structures.forEach(structure => {
            accessibleStructureIds.push(structure.id);
          });
        }
      });

      if (accessibleStructureIds.length === 0) {
        console.warn('Aucune structure trouvée pour cet utilisateur');
        return [];
      }

      whereClause = {
        structureId: {
          in: accessibleStructureIds
        }
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        produit: {
          include: {
            category: true
          }
        }
      }
    });

    return transactions.map((tx) => ({
      ...tx,
      type: tx.type === 'entree' ? 'IN' : 'OUT', // Mapper entree → IN, sortie → OUT
      categoryName: tx.produit.category.name,
      productName: tx.produit.name,
      imageUrl: tx.produit.imageUrl,
      price: tx.produit.price ?? undefined,
      unit: tx.produit.unit
    }));

  } catch (error) {
    console.error('Erreur lors de la lecture des transactions:', error);
    return [];
  }
}

// Fonction qui permet de récupérer les statistiques globales des produits d'une structure
export async function getProductOverviewStats(userId: string, structureId?: string): Promise<ProductOverviewStats> {
  try {
    if (!userId) {
      throw new Error('L\'ID utilisateur Clerk est requis');
    }

    // Vérifier les permissions utilisateur et récupérer les structures accessibles
    const userStructures = await getUserMinistereStructures(userId);

    if (!userStructures || userStructures.length === 0) {
      // Retourner des statistiques vides si aucune structure n'existe encore
      return {
        structure: {
          id: '',
          name: 'Aucune structure',
          ministere: {
            id: '',
            name: 'Aucun ministère',
            abreviation: ''
          }
        },
        overview: {
          totalProducts: 0,
          totalCategories: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalTransactions: 0,
          stockValue: 0
        },
        topProducts: [],
        alerts: {
          lowStock: false,
          outOfStock: false,
          lowStockCount: 0,
          outOfStockCount: 0
        }
      };
    }

    // Déterminer les structures cibles
    let whereClause: { structureId?: string | { in: string[] } } = {};

    if (structureId && structureId.trim() !== '') {
      // Structure spécifique sélectionnée
      const hasAccess = userStructures.some(ministere =>
        ministere.structures?.some(structure => structure.id === structureId)
      );

      if (!hasAccess) {
        throw new Error('Accès non autorisé à cette structure');
      }

      whereClause = { structureId: structureId };
    } else {
      // "Toutes les structures" - récupérer les IDs de toutes les structures accessibles
      const accessibleStructureIds: string[] = [];
      userStructures.forEach(ministere => {
        if (ministere.structures) {
          ministere.structures.forEach(structure => {
            accessibleStructureIds.push(structure.id);
          });
        }
      });

      if (accessibleStructureIds.length === 0) {
        throw new Error('Aucune structure trouvée pour cet utilisateur');
      }

      whereClause = {
        structureId: {
          in: accessibleStructureIds
        }
      };
    }

    // Récupérer les statistiques des produits
    // Calculer le nombre total de catégories (toutes distinctes)
    const totalCategories = await prisma.category.count({
      where: whereClause
    });

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      recentTransactions,
      topProducts,
      structureInfo
    ] = await Promise.all([
      // Nombre total de produits
      prisma.produit.count({
        where: whereClause
      }),

      // Produits en stock faible (moins de 10 unités)
      prisma.produit.count({
        where: {
          ...whereClause,
          quantity: { lt: 10 }
        }
      }),

      // Produits en rupture de stock
      prisma.produit.count({
        where: {
          ...whereClause,
          quantity: { lte: 0 }
        }
      }),

      // Transactions récentes (30 derniers jours)
      prisma.transaction.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Top 5 des produits les plus utilisés (basé sur les transactions)
      prisma.transaction.groupBy({
        by: ['produitId'],
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      }),

      // Informations sur la structure (si une structure spécifique est sélectionnée)
      structureId && structureId.trim() !== ''
        ? prisma.structure.findUnique({
          where: { id: structureId },
          include: {
            ministere: true
          }
        })
        : null
    ]);

    // Récupérer les détails des produits les plus utilisés
    const topProductsDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.produit.findUnique({
          where: { id: item.produitId },
          include: { category: true }
        });
        return {
          id: product?.id || '',
          name: product?.name || '',
          categoryName: product?.category?.name || '',
          transactionCount: item._count.id,
          totalQuantityUsed: item._sum.quantity || 0,
          currentStock: product?.quantity || 0,
          unit: product?.unit || ''
        };
      })
    );

    // Calculer la valeur totale du stock
    const stockValue = await prisma.produit.aggregate({
      where: whereClause,
      _sum: {
        price: true
      }
    });

    return {
      structure: structureInfo ? {
        id: structureInfo.id,
        name: structureInfo.name,
        ministere: {
          id: structureInfo.ministere?.id || '',
          name: structureInfo.ministere?.name || '',
          abreviation: structureInfo.ministere?.abreviation || ''
        }
      } : {
        id: 'all',
        name: 'Toutes les structures accessibles',
        ministere: {
          id: 'all',
          name: 'Tous les ministères',
          abreviation: 'TOUS'
        }
      },
      overview: {
        totalProducts,
        totalCategories,
        lowStockProducts,
        outOfStockProducts,
        totalTransactions: recentTransactions,
        stockValue: stockValue._sum.price || 0
      },
      topProducts: topProductsDetails.filter(p => p.id), // Filtrer les produits valides
      alerts: {
        lowStock: lowStockProducts > 0,
        outOfStock: outOfStockProducts > 0,
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStockProducts
      }
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
}

// Fonction pour récupérer la distribution des produits par catégorie pour le graphique
export async function getProductCategoryDistribution(userId: string, structureId?: string) {
  try {
    if (!userId) {
      throw new Error('L\'ID utilisateur Clerk est requis');
    }

    // Vérifier les permissions utilisateur et récupérer les structures accessibles
    const userStructures = await getUserMinistereStructures(userId);

    if (!userStructures || userStructures.length === 0) {
      // Retourner un tableau vide si aucune structure n'existe encore
      console.warn('Aucune structure accessible pour cet utilisateur');
      return [];
    }

    // Déterminer les structures cibles
    let whereClause: { structureId?: string | { in: string[] } } = {};

    if (structureId && structureId.trim() !== '') {
      // Structure spécifique sélectionnée
      const hasAccess = userStructures.some(ministere =>
        ministere.structures?.some(structure => structure.id === structureId)
      );

      if (!hasAccess) {
        throw new Error('Accès non autorisé à cette structure');
      }

      whereClause = { structureId: structureId };
    } else {
      // "Toutes les structures" - récupérer les IDs de toutes les structures accessibles
      const accessibleStructureIds: string[] = [];
      userStructures.forEach(ministere => {
        if (ministere.structures) {
          ministere.structures.forEach(structure => {
            accessibleStructureIds.push(structure.id);
          });
        }
      });

      if (accessibleStructureIds.length === 0) {
        throw new Error('Aucune structure trouvée pour cet utilisateur');
      }

      whereClause = {
        structureId: {
          in: accessibleStructureIds
        }
      };
    }

    // Récupérer la distribution des produits par catégorie
    const categoryDistribution = await prisma.category.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            produits: true
          }
        },
        structure: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        produits: {
          _count: 'desc'
        }
      },
      take: 10 // Prendre plus de catégories pour avoir du choix après traitement
    });

    // Si "Toutes les structures", créer des noms distincts pour chaque structure
    const processedCategories = categoryDistribution.map(category => {
      const displayName = structureId && structureId.trim() !== ''
        ? category.name
        : `${category.name} (${category.structure.name})`;

      return {
        name: displayName,
        pv: category._count.produits,
        uv: category._count.produits * 2,
        originalName: category.name,
        structureName: category.structure.name,
        count: category._count.produits
      };
    });

    // Trier par nombre de produits et prendre les 5 premiers
    const topCategories = processedCategories
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Transformer les données pour le graphique
    const chartData = topCategories.map(category => ({
      name: category.name,
      pv: category.pv,
      uv: category.uv,
    }));

    return chartData;

  } catch (error) {
    console.error('Erreur lors de la récupération de la distribution des catégories:', error);
    return [];
  }
}
export async function getStockSummary(userId: string, structureId?: string): Promise<StockSummary> {
  try {
    if (!userId) {
      throw new Error('L\'ID utilisateur Clerk est requis');
    }

    // Vérifier les permissions utilisateur et récupérer les structures accessibles
    const userStructures = await getUserMinistereStructures(userId);

    if (!userStructures || userStructures.length === 0) {
      // Retourner un résumé vide si aucune structure n'existe encore
      return {
        inStockCount: 0,
        alertStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        criticalProducts: []
      };
    }

    // Déterminer les structures cibles
    let whereClause: { structureId?: string | { in: string[] } } = {};

    if (structureId && structureId.trim() !== '') {
      // Structure spécifique sélectionnée
      const hasAccess = userStructures.some(ministere =>
        ministere.structures?.some(structure => structure.id === structureId)
      );

      if (!hasAccess) {
        throw new Error('Accès non autorisé à cette structure');
      }

      whereClause = { structureId: structureId };
    } else {
      // "Toutes les structures" - récupérer les IDs de toutes les structures accessibles
      const accessibleStructureIds: string[] = [];
      userStructures.forEach(ministere => {
        if (ministere.structures) {
          ministere.structures.forEach(structure => {
            accessibleStructureIds.push(structure.id);
          });
        }
      });

      if (accessibleStructureIds.length === 0) {
        throw new Error('Aucune structure trouvée pour cet utilisateur');
      }

      whereClause = {
        structureId: {
          in: accessibleStructureIds
        }
      };
    }

    const allProducts = await prisma.produit.findMany({
      where: whereClause,
      include: {
        category: true
      }
    })
    
    // Seuils de stock :
    // - Stock faible : <= 5% de la quantité initiale
    // - Stock d'alerte : <= 10% de la quantité initiale
    const lowStockThreshold = (initialQty: number) => Math.max(1, Math.ceil(initialQty * 0.05));
    const alertStockThreshold = (initialQty: number) => Math.max(2, Math.ceil(initialQty * 0.10));
    
    const inStock = allProducts.filter((p) => {
      return p.quantity > alertStockThreshold(p.initialQuantity);
    });
    
    const alertStock = allProducts.filter((p) => {
      const lowThreshold = lowStockThreshold(p.initialQuantity);
      const alertThreshold = alertStockThreshold(p.initialQuantity);
      return p.quantity > lowThreshold && p.quantity <= alertThreshold;
    });
    
    const lowStock = allProducts.filter((p) => {
      const threshold = lowStockThreshold(p.initialQuantity);
      return p.quantity > 0 && p.quantity <= threshold;
    });
    
    const outOfStock = allProducts.filter((p) => p.quantity === 0);
    const criticalProducts = [...lowStock, ...outOfStock];
    
    return {
      inStockCount: inStock.length,
      alertStockCount: alertStock.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      criticalProducts: criticalProducts.map((p) => ({
        ...p,
        categoryName: p.category.name
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      inStockCount: 0,
      alertStockCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      criticalProducts: []
    }
  }
}

/**
 * Récupère les statistiques détaillées d'une structure sur une période donnée
 * Inclut les alimentations, octrois, et métriques par produit
 */
export async function getStructureStatistics(
  structureId: string,
  startDate?: Date,
  endDate?: Date
): Promise<StructureStatistics | null> {
  try {
    // Récupérer la structure avec son ministère
    const structure = await prisma.structure.findUnique({
      where: { id: structureId },
      include: { ministere: true }
    });

    if (!structure) {
      throw new Error('Structure non trouvée');
    }

    // Définir les dates par défaut (dernier mois si non spécifiées)
    const dateDebut = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
    const dateFin = endDate || new Date();

    // Filtres de période pour Prisma
    const dateFilter = {
      createdAt: {
        gte: dateDebut,
        lte: dateFin
      }
    };

    // Récupérer toutes les alimentations de la période
    const alimentations = await prisma.alimentation.findMany({
      where: {
        structureId,
        ...dateFilter
      },
      include: {
        produit: {
          include: {
            category: true
          }
        }
      }
    });

    // Récupérer tous les octrois de la période
    const octrois = await prisma.octroi.findMany({
      where: {
        structureId,
        ...dateFilter
      },
      include: {
        produit: {
          include: {
            category: true
          }
        }
      }
    });

    // Récupérer tous les produits de la structure
    const produits = await prisma.produit.findMany({
      where: { structureId },
      include: { category: true }
    });

    // Créer un map pour agréger les données par produit
    const produitsMap = new Map<string, {
      produit: typeof produits[0];
      alimentations: typeof alimentations;
      octrois: typeof octrois;
    }>();

    // Initialiser le map avec tous les produits
    produits.forEach(produit => {
      produitsMap.set(produit.id, {
        produit,
        alimentations: [],
        octrois: []
      });
    });

    // Associer alimentations et octrois aux produits
    alimentations.forEach(alim => {
      const data = produitsMap.get(alim.produitId);
      if (data) {
        data.alimentations.push(alim);
      }
    });

    octrois.forEach(oct => {
      const data = produitsMap.get(oct.produitId);
      if (data) {
        data.octrois.push(oct);
      }
    });

    // Calculer les statistiques par produit
    const statistiquesParProduit: ProductStatistics[] = [];

    for (const [produitId, data] of produitsMap.entries()) {
      const { produit, alimentations: prodAlims, octrois: prodOcts } = data;

      // Stats alimentations
      const totalQuantiteAlim = prodAlims.reduce((sum, a) => sum + a.quantite, 0);
      const totalValeurAlim = prodAlims.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0);
      const prixMoyen = prodAlims.length > 0 
        ? totalValeurAlim / totalQuantiteAlim 
        : 0;
      
      // Dernière alimentation (plus récente)
      const derniereAlim = prodAlims.length > 0
        ? prodAlims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;

      // Stats octrois
      const totalQuantiteOct = prodOcts.reduce((sum, o) => sum + o.quantite, 0);
      const totalValeurOct = prixMoyen > 0 
        ? totalQuantiteOct * prixMoyen 
        : 0;
      
      // Dernier octroi
      const dernierOct = prodOcts.length > 0
        ? prodOcts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;

      // Métriques de stock
      const stockActuel = produit.quantity;
      const stockInitial = produit.initialQuantity || 0;
      const tauxUtilisation = stockInitial > 0 
        ? ((stockInitial - stockActuel) / stockInitial) * 100 
        : 0;
      
      // Taux de rotation = quantité totale alimentée / stock moyen
      const stockMoyen = (stockInitial + stockActuel) / 2;
      const tauxRotation = stockMoyen > 0 
        ? totalQuantiteAlim / stockMoyen 
        : 0;

      statistiquesParProduit.push({
        produitId: produit.id,
        produitName: produit.name,
        produitUnit: produit.unit,
        categoryName: produit.category.name,
        imageUrl: produit.imageUrl,
        alimentations: {
          count: prodAlims.length,
          quantiteTotale: totalQuantiteAlim,
          valeurTotaleMRU: totalValeurAlim,
          prixMoyenUnitaire: prixMoyen,
          dernierPrixUnitaire: derniereAlim?.prixUnitaire || null,
          derniereAlimentationDate: derniereAlim?.createdAt || null
        },
        octrois: {
          count: prodOcts.length,
          quantiteTotale: totalQuantiteOct,
          valeurTotaleMRU: totalValeurOct,
          dernierOctroiDate: dernierOct?.createdAt || null
        },
        stock: {
          actuel: stockActuel,
          initial: stockInitial,
          tauxUtilisation: Math.round(tauxUtilisation * 100) / 100,
          tauxRotation: Math.round(tauxRotation * 100) / 100
        }
      });
    }

    // Calculer les statistiques globales
    const totalAlimentations = alimentations.length;
    const totalQuantiteAlimentations = alimentations.reduce((sum, a) => sum + a.quantite, 0);
    const totalValeurAlimentations = alimentations.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0);

    const totalOctrois = octrois.length;
    const totalQuantiteOctrois = octrois.reduce((sum, o) => sum + o.quantite, 0);
    const totalValeurOctrois = statistiquesParProduit.reduce((sum, p) => sum + p.octrois.valeurTotaleMRU, 0);

    // Compter les produits ayant eu une activité
    const produitsDistincts = new Set([
      ...alimentations.map(a => a.produitId),
      ...octrois.map(o => o.produitId)
    ]).size;

    // Statuts workflow
    const alimentationsEnAttente = alimentations.filter(a => 
      !['VALIDE_ORDONNATEUR', 'REJETE'].includes(a.statut)
    ).length;
    const alimentationsValidees = alimentations.filter(a => a.statut === 'VALIDE_ORDONNATEUR').length;
    const alimentationsRejetees = alimentations.filter(a => a.statut === 'REJETE').length;

    const octroiEnAttente = octrois.filter(o => 
      !['VALIDE_ORDONNATEUR', 'REJETE'].includes(o.statut)
    ).length;
    const octroiValides = octrois.filter(o => o.statut === 'VALIDE_ORDONNATEUR').length;
    const octroiRejetes = octrois.filter(o => o.statut === 'REJETE').length;

    // Top produits
    const topPlusAlimentes = [...statistiquesParProduit]
      .sort((a, b) => b.alimentations.quantiteTotale - a.alimentations.quantiteTotale)
      .slice(0, 5);

    const topPlusOctroyes = [...statistiquesParProduit]
      .sort((a, b) => b.octrois.quantiteTotale - a.octrois.quantiteTotale)
      .slice(0, 5);

    const topPlusValeur = [...statistiquesParProduit]
      .sort((a, b) => b.alimentations.valeurTotaleMRU - a.alimentations.valeurTotaleMRU)
      .slice(0, 5);

    // Calculer les alimentations par produit et structure
    // Récupérer toutes les structures du même ministère
    const toutesStructures = await prisma.structure.findMany({
      where: { ministereId: structure.ministereId },
      include: { ministere: true }
    });

    // Créer un map pour agréger les alimentations par produit et structure
    const alimentationsParProduitStructureMap = new Map<string, {
      produitId: string;
      produitName: string;
      produitUnit: string;
      categoryName: string;
      structures: Map<string, {
        structureId: string;
        structureName: string;
        ministereAbrev: string;
        alimentations: typeof alimentations;
      }>;
    }>();

    // Récupérer toutes les alimentations du ministère sur la période
    const alimentationsDuMinistere = await prisma.alimentation.findMany({
      where: {
        structure: {
          ministereId: structure.ministereId
        },
        ...dateFilter
      },
      include: {
        produit: {
          include: {
            category: true
          }
        },
        structure: {
          include: {
            ministere: true
          }
        }
      }
    });

    // Agréger par produit et structure
    alimentationsDuMinistere.forEach(alim => {
      const produitId = alim.produitId;
      const produitName = alim.produit.name;
      const produitUnit = alim.produit.unit;
      const categoryName = alim.produit.category.name;
      const structureId = alim.structureId;
      const structureName = alim.structure.name;
      const ministereAbrev = alim.structure.ministere.abreviation;

      // Initialiser le produit si nécessaire
      if (!alimentationsParProduitStructureMap.has(produitId)) {
        alimentationsParProduitStructureMap.set(produitId, {
          produitId,
          produitName,
          produitUnit,
          categoryName,
          structures: new Map()
        });
      }

      const produitData = alimentationsParProduitStructureMap.get(produitId)!;

      // Initialiser la structure si nécessaire
      if (!produitData.structures.has(structureId)) {
        produitData.structures.set(structureId, {
          structureId,
          structureName,
          ministereAbrev,
          alimentations: []
        });
      }

      // Ajouter l'alimentation
      produitData.structures.get(structureId)!.alimentations.push(alim);
    });

    // Convertir en tableau avec totaux
    const alimentationsParProduitStructure = Array.from(alimentationsParProduitStructureMap.values())
      .map(produitData => {
        const structures = Array.from(produitData.structures.values()).map(structData => {
          const count = structData.alimentations.length;
          const quantiteTotale = structData.alimentations.reduce((sum, a) => sum + a.quantite, 0);
          const valeurTotaleMRU = structData.alimentations.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0);

          return {
            structureId: structData.structureId,
            structureName: structData.structureName,
            ministereAbrev: structData.ministereAbrev,
            count,
            quantiteTotale,
            valeurTotaleMRU: Math.round(valeurTotaleMRU * 100) / 100
          };
        });

        // Calculer les totaux pour le produit
        const totaux = {
          count: structures.reduce((sum, s) => sum + s.count, 0),
          quantiteTotale: structures.reduce((sum, s) => sum + s.quantiteTotale, 0),
          valeurTotaleMRU: Math.round(structures.reduce((sum, s) => sum + s.valeurTotaleMRU, 0) * 100) / 100
        };

        return {
          produitId: produitData.produitId,
          produitName: produitData.produitName,
          produitUnit: produitData.produitUnit,
          categoryName: produitData.categoryName,
          structures,
          totaux
        };
      })
      // Trier par valeur totale décroissante
      .sort((a, b) => b.totaux.valeurTotaleMRU - a.totaux.valeurTotaleMRU);

    return {
      structureId: structure.id,
      structureName: structure.name,
      ministereId: structure.ministere.id,
      ministereName: structure.ministere.name,
      periode: {
        debut: dateDebut,
        fin: dateFin
      },
      overview: {
        totalAlimentations,
        quantiteTotaleAlimentations: totalQuantiteAlimentations,
        valeurTotaleAlimentationsMRU: Math.round(totalValeurAlimentations * 100) / 100,
        totalOctrois,
        quantiteTotaleOctrois: totalQuantiteOctrois,
        valeurTotaleOctroisMRU: Math.round(totalValeurOctrois * 100) / 100,
        produitsDistincts,
        alimentationsEnAttente,
        alimentationsValidees,
        alimentationsRejetees,
        octroiEnAttente,
        octroiValides,
        octroiRejetes
      },
      parProduit: statistiquesParProduit,
      topProduits: {
        plusAlimentes: topPlusAlimentes,
        plusOctroyes: topPlusOctroyes,
        plusValeurAlimentations: topPlusValeur
      },
      alimentationsParProduitStructure
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de structure:', error);
    return null;
  }
}

