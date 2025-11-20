import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les utilisateurs avec leurs relations
export async function GET() {
  try {
    await requireAdmin();

    // Récupérer tous les utilisateurs avec leurs relations
    const users = await prisma.user.findMany({
      include: {
        role: true,
        ministere: true,
        structure: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Récupérer tous les ministères avec leurs structures
    const ministeres = await prisma.ministere.findMany({
      include: {
        structures: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Récupérer tous les rôles
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      users,
      ministeres,
      roles,
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const data = await request.json();
    const {
      email,
      firstName,
      name,
      roleId,
      ministereId,
      structureId,
      isAdmin = false,
      isApproved = true,
      password = 'Password123!' // Mot de passe par défaut
    } = data;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Valider les données
    if (!email || !firstName || !name) {
      return NextResponse.json(
        { error: 'Email, prénom et nom sont requis' },
        { status: 400 }
      );
    }

    // Valider la structure si le rôle l'exige
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (role?.requiresStructure && !structureId) {
        return NextResponse.json(
          { error: 'Ce rôle nécessite la sélection d\'une structure' },
          { status: 400 }
        );
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur dans la base de données
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        name,
        password: hashedPassword,
        isAdmin,
        isApproved,
        roleId: roleId || null,
        ministereId: ministereId || null,
        structureId: structureId || null,
      },
      include: {
        role: true,
        ministere: true,
        structure: true,
      },
    });

    // Note: Pour créer complètement l'utilisateur dans Clerk,
    // il faudrait utiliser l'API Clerk pour créer un compte utilisateur
    // Ceci est optionnel selon vos besoins

    return NextResponse.json({
      message: 'Utilisateur créé avec succès',
      user: newUser,
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}