import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAdmin()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer tous les ministères
    const ministeres = await prisma.ministere.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      ministeres
    })

  } catch (error) {
    console.error('Erreur récupération ministères:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { name, abreviation } = await req.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Le nom est obligatoire' },
        { status: 400 }
      )
    }

    const ministere = await prisma.ministere.create({
      data: {
        name: name.trim(),
        abreviation: abreviation?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      ministere
    })

  } catch (error) {
    console.error('Erreur création ministère:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
