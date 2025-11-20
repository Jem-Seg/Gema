import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        isAdmin: true,
        isApproved: true,
        roleId: true,
        ministereId: true,
        structureId: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        },
        ministere: {
          select: {
            id: true,
            name: true,
            abreviation: true,
          }
        },
        structure: {
          select: {
            id: true,
            name: true,
            abreviation: true,
            ministere: {
              select: {
                name: true,
                abreviation: true,
              }
            }
          }
        },
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log('👤 Utilisateur récupéré:', {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      roleName: user.role?.name,
      ministereId: user.ministereId,
      structureId: user.structureId
    });

    // Déterminer les structures accessibles selon le rôle
    let structures: any[] = []

    if (user.isAdmin) {
      console.log('🔑 Mode Admin - Récupération de toutes les structures');
      // Admin: toutes les structures de tous les ministères
      const ministeres = await prisma.ministere.findMany({
        select: {
          id: true,
          name: true,
          abreviation: true,
          structures: {
            select: {
              id: true,
              name: true,
              abreviation: true,
              ministere: {
                select: {
                  name: true,
                  abreviation: true,
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })
      structures = ministeres
      console.log('✅ Structures admin trouvées:', ministeres.length);
    } else if (user.role?.name === 'Responsable Achats' || 
               user.role?.name === 'Responsable Financier' ||
               user.role?.name === 'Directeur financier' ||
               user.role?.name === 'Ordonnateur') {
      console.log('🔑 Mode Responsable - Rôle:', user.role.name);
      // Responsables: toutes les structures de leur ministère
      if (user.ministereId) {
        console.log('📋 Récupération structures du ministère:', user.ministereId);
        const ministere = await prisma.ministere.findUnique({
          where: { id: user.ministereId },
          select: {
            id: true,
            name: true,
            abreviation: true,
            structures: {
              select: {
                id: true,
                name: true,
                abreviation: true,
                ministere: {
                  select: {
                    name: true,
                    abreviation: true,
                  }
                }
              }
            }
          }
        })
        if (ministere) {
          structures = [ministere]
          console.log('✅ Ministère trouvé avec', ministere.structures.length, 'structures');
        } else {
          console.log('❌ Ministère non trouvé');
        }
      } else {
        console.log('❌ Utilisateur sans ministereId');
      }
    } else {
      console.log('🔑 Mode Agent/Directeur - Rôle:', user.role?.name);
      // Agent de saisie, Directeur: leur structure uniquement
      if (user.structure) {
        console.log('📋 Structure de l\'utilisateur:', user.structure.name);
        structures = [{
          id: user.ministere?.id || '',
          name: user.ministere?.name || '',
          abreviation: user.ministere?.abreviation || '',
          structures: [user.structure]
        }]
        console.log('✅ Structure assignée');
      } else {
        console.log('❌ Utilisateur sans structure assignée');
      }
    }

    console.log('📤 Retour de', structures.length, 'ministère(s) avec structures');
    return NextResponse.json({ user, structures })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
