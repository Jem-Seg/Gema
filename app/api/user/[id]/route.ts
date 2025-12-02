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
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Déterminer les structures accessibles selon le rôle
    let structures: any[] = []

    if (user.isAdmin) {
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
    } else if (user.role?.name === 'Responsable Achats' || 
               user.role?.name === 'Responsable Financier' ||
               user.role?.name === 'Directeur financier' ||
               user.role?.name === 'Ordonnateur') {
      // Responsables: toutes les structures de leur ministère
      if (user.ministereId) {
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
        }
      }
    } else {
      // Agent de saisie: toutes les structures de leur ministère
      if (user.ministereId) {
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
              }
            }
          }
        })
        if (ministere) {
          structures = [ministere]
        }
      }
    }

    return NextResponse.json({ user, structures })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
