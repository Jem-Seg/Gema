import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Pour des raisons de sécurité, toujours retourner succès même si l'email n'existe pas
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
      })
    }

    // Supprimer les anciens tokens pour cet email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    })

    // Générer un token unique
    const token = randomBytes(32).toString('hex')
    
    // Le token expire dans 1 heure
    const expires = new Date(Date.now() + 3600000)

    // Créer le token de réinitialisation
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires
      }
    })

    // Dans un environnement de production, vous enverriez un email ici
    // Pour le développement, on retourne le lien
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    // Toujours loguer le lien en mode développement pour debug
    // Next.js définit automatiquement NODE_ENV mais on vérifie aussi l'URL
    const isDevelopment = process.env.NODE_ENV !== 'production' || resetLink.includes('localhost')
    
    if (isDevelopment) {
      console.log('\n=========================================')
      console.log('🔐 LIEN DE RÉINITIALISATION DE MOT DE PASSE')
      console.log('=========================================')
      console.log('Email:', email)
      console.log('Lien:', resetLink)
      console.log('Expire dans: 1 heure')
      console.log('=========================================\n')
    }

    return NextResponse.json({
      success: true,
      message: isDevelopment 
        ? 'Lien de réinitialisation généré ! (Voir ci-dessous en mode développement)'
        : 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      // En développement seulement
      developmentLink: isDevelopment ? resetLink : undefined
    })
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
