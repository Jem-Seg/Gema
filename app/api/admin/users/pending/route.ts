import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAdmin()
    
    // Récupérer les utilisateurs en attente d'approbation
    const pendingUsers = await prisma.user.findMany({
      where: {
        isApproved: false,
        isAdmin: false
      },
      include: {
        role: true,
        ministere: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Récupérer tous les ministères et rôles pour l'interface d'affectation
    const ministeres = await prisma.ministere.findMany({
      include: {
        structures: true
      }
    })

    const roles = await prisma.role.findMany()

    return NextResponse.json({ 
      pendingUsers,
      ministeres,
      roles
    })
  } catch (error) {
    console.error('Erreur récupération utilisateurs en attente:', error)
    
    if ((error as Error).message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    if ((error as Error).message === 'Accès non autorisé') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }
    
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin()

    const { 
      targetUserId, 
      roleId, 
      ministereId, 
      action 
    } = await req.json()

    if (action === 'approve') {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isApproved: true,
          roleId: roleId || null,
          ministereId: ministereId || null
        }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Utilisateur approuvé avec succès'
      })
    }

    if (action === 'reject') {
      await prisma.user.delete({
        where: { id: targetUserId }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Utilisateur rejeté et supprimé'
      })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('Erreur traitement utilisateur:', error)
    
    if ((error as Error).message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    if ((error as Error).message === 'Accès non autorisé') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }
    
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}