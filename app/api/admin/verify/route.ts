import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server-auth'
import { checkAdminStatus } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { secretKey } = body

    if (!secretKey) {
      return NextResponse.json({ error: 'Clé de sécurité requise' }, { status: 400 })
    }

    const isAdmin = await checkAdminStatus(user.id, secretKey)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Clé de sécurité invalide' }, { status: 403 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vous êtes maintenant administrateur'
    })
  } catch (error) {
    console.error('Erreur vérification admin:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const isAdmin = await checkAdminStatus(user.id)
    
    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Erreur vérification admin:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}