import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { checkAdminStatus } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAdmin()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const ministeres = await prisma.ministere.findMany({
      include: {
        _count: {
          select: {
            structures: true,
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ ministeres })
  } catch (error) {
    console.error('Erreur récupération ministères:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { name, abreviation, address, phone, email } = await req.json()

    if (!name || !abreviation) {
      return NextResponse.json({ 
        error: 'Nom et abréviation sont requis' 
      }, { status: 400 })
    }

    // Vérifier l'unicité de l'abréviation
    const existingMinistere = await prisma.ministere.findUnique({
      where: { abreviation }
    })

    if (existingMinistere) {
      return NextResponse.json({ 
        error: 'Cette abréviation existe déjà' 
      }, { status: 400 })
    }

    const ministere = await prisma.ministere.create({
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
      message: 'Ministère créé avec succès',
      ministere
    })
  } catch (error) {
    console.error('Erreur création ministère:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}