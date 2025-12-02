import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les informations complètes de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
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
            description: true,
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
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
