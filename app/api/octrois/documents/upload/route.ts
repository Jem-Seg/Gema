import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Fonction utilitaire pour récupérer les infos utilisateur
async function getUserInfo() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: 'Non authentifié', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: { 
      role: true,
      ministere: true
    }
  });

  if (!dbUser || !dbUser.isApproved) {
    return { error: 'Utilisateur non approuvé', status: 403 };
  }

  return { user: dbUser };
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getUserInfo();
    if ('error' in userInfo) {
      return NextResponse.json({ error: userInfo.error }, { status: userInfo.status });
    }

    const { user } = userInfo;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const octroiId = formData.get('octroiId') as string;
    const type = formData.get('type') as string || 'PV_OCTROI';

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    if (!octroiId) {
      return NextResponse.json({ error: 'ID octroi manquant' }, { status: 400 });
    }

    // Vérifier que l'octroi existe
    const octroi = await prisma.octroi.findUnique({
      where: { id: octroiId }
    });

    if (!octroi) {
      return NextResponse.json({ error: 'Octroi non trouvé' }, { status: 404 });
    }

    // Créer le répertoire d'upload s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'octrois', octroiId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL relative pour accéder au fichier
    const fileUrl = `/uploads/octrois/${octroiId}/${fileName}`;

    // Enregistrer dans la base de données
    const document = await prisma.documentOctroi.create({
      data: {
        octroiId,
        type,
        nom: file.name,
        url: fileUrl,
        taille: file.size,
        mimeType: file.type,
        uploadedBy: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploadé avec succès',
      document
    });
  } catch (error) {
    console.error('Erreur upload document octroi:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du document' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
