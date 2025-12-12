// API route pour vérifier les comptes admin
// Accessible à /api/admin/check-accounts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Récupérer tous les utilisateurs
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        isAdmin: true,
        isApproved: true,
        roleId: true,
        password: true,
      },
    });

    const admins = allUsers.filter(u => u.isAdmin);
    const nonAdmins = allUsers.filter(u => !u.isAdmin);

    return NextResponse.json({
      success: true,
      total: allUsers.length,
      admins: admins.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.name}`,
        isApproved: u.isApproved,
        hasPassword: !!u.password,
      })),
      nonAdmins: nonAdmins.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.name}`,
        isApproved: u.isApproved,
        hasRole: !!u.roleId,
        hasPassword: !!u.password,
      })),
    });
  } catch (error) {
    console.error('Erreur récupération comptes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST pour créer un admin de test
export async function POST() {
  try {
    // Vérifier s'il existe déjà un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: 'Un admin existe déjà',
        admin: {
          email: existingAdmin.email,
          name: `${existingAdmin.firstName} ${existingAdmin.name}`,
        },
      });
    }

    // Créer un admin de test
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@gestock.mr',
        password: hashedPassword,
        firstName: 'Admin',
        name: 'Système',
        isAdmin: true,
        isApproved: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin créé avec succès',
      admin: {
        email: admin.email,
        defaultPassword: 'Admin123!',
        warning: 'Changez ce mot de passe après la première connexion!',
      },
    });
  } catch (error) {
    console.error('Erreur création admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
