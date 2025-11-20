import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    // Récupérer les statistiques en parallèle
    const [
      totalUsers,
      pendingUsers,
      totalMinisteres,
      totalStructures,
      totalRoles
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { isApproved: false }
      }),
      prisma.ministere.count(),
      prisma.structure.count(),
      prisma.role.count()
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        pendingUsers,
        totalMinisteres,
        totalStructures,
        totalRoles
      }
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}