import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import prisma from '@/lib/prisma'

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { name, abreviation, address, phone, email } = await req.json()
    const { id: ministereId } = await context.params

    if (!name || !abreviation) {
      return NextResponse.json({
        error: 'Nom et abréviation sont requis'
      }, { status: 400 })
    }

    // Vérifier l'unicité de l'abréviation (exclure le ministère actuel)
    const existingMinistere = await prisma.ministere.findFirst({
      where: {
        abreviation,
        NOT: { id: ministereId }
      }
    })

    if (existingMinistere) {
      return NextResponse.json({
        error: 'Cette abréviation existe déjà'
      }, { status: 400 })
    }

    const updatedMinistere = await prisma.ministere.update({
      where: { id: ministereId },
      data: {
        name,
        abreviation,
        address: address || null,
        phone: phone || null,
        email: email || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Ministère mis à jour avec succès',
      ministere: updatedMinistere
    })
  } catch (error) {
    console.error('Erreur mise à jour ministère:', error)
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id: ministereId } = await context.params

    // Vérifier s'il y a des utilisateurs ou structures rattachés
    const ministere = await prisma.ministere.findUnique({
      where: { id: ministereId },
      include: {
        _count: {
          select: {
            structures: true,
            users: true
          }
        }
      }
    })

    if (!ministere) {
      return NextResponse.json({
        error: 'Ministère non trouvé'
      }, { status: 404 })
    }

    if (ministere._count.structures > 0 || ministere._count.users > 0) {
      return NextResponse.json({
        error: 'Impossible de supprimer un ministère qui a des structures ou des utilisateurs rattachés'
      }, { status: 400 })
    }

    await prisma.ministere.delete({
      where: { id: ministereId }
    })

    return NextResponse.json({
      success: true,
      message: 'Ministère supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur suppression ministère:', error)
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
