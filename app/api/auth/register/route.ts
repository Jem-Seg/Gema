import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, name, adminSecretKey } = await request.json()

    // Validation des données
    if (!email || !password || !firstName || !name) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Vérifier si c'est le premier utilisateur (admin initial)
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    // Si c'est le premier utilisateur, vérifier la clé admin
    if (isFirstUser) {
      const expectedAdminKey = process.env.ADMIN_SECRET_KEY
      
      if (!adminSecretKey || adminSecretKey !== expectedAdminKey) {
        return NextResponse.json(
          { message: 'Clé d\'administration invalide' },
          { status: 403 }
        )
      }
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        name,
        isApproved: isFirstUser ? true : false, // Premier utilisateur auto-approuvé
        isAdmin: isFirstUser ? true : false,    // Premier utilisateur devient admin
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        isApproved: true,
        isAdmin: true,
      }
    })

    return NextResponse.json(
      { 
        message: isFirstUser 
          ? 'Compte administrateur créé avec succès' 
          : 'Inscription réussie',
        user,
        isFirstUser 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
