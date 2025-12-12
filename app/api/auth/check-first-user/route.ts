import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      isFirstUser: userCount === 0
    })
  } catch (error) {
    console.error('Erreur lors de la vérification du premier utilisateur:', error)
    return NextResponse.json(
      { isFirstUser: false },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
