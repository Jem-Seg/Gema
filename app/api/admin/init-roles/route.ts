import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import prisma from '@/lib/prisma'

export async function POST() {
  try {
    await requireAdmin();

    // Rôles par défaut à créer (workflow simplifié - 4 rôles)
    const defaultRoles = [
      {
        name: 'Agent de saisie',
        description: 'Utilisateur chargé de la saisie des données',
      },
      {
        name: 'Responsable Achats',
        description: 'Responsable des achats du ministère',
      },
      {
        name: 'Responsable Financier',
        description: 'Responsable financier du ministère',
      },
      {
        name: 'Ordonnateur',
        description: 'Ordonnateur du ministère',
      }
    ];

    // Vérifier si les rôles existent déjà
    const existingRoles = await prisma.role.findMany({
      where: {
        name: {
          in: defaultRoles.map(role => role.name)
        }
      }
    });

    const existingRoleNames = existingRoles.map(role => role.name);
    const rolesToCreate = defaultRoles.filter(role => 
      !existingRoleNames.includes(role.name)
    );

    if (rolesToCreate.length === 0) {
      return NextResponse.json({ 
        message: 'Tous les rôles par défaut existent déjà',
        roles: existingRoles
      });
    }

    // Créer les nouveaux rôles
    const createdRoles = await Promise.all(
      rolesToCreate.map(roleData =>
        prisma.role.create({ data: roleData })
      )
    );

    return NextResponse.json({ 
      success: true,
      message: `${createdRoles.length} rôle(s) créé(s) avec succès`,
      createdRoles,
      existingRoles: existingRoles.length
    });
  } catch (error) {
    console.error('Erreur initialisation rôles:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}