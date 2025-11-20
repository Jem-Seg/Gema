import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alimentationId = formData.get('alimentationId') as string;
    const type = formData.get('type') as string; // FACTURE, PV_RECEPTION, AUTRE
    const userId = formData.get('userId') as string;

    if (!file || !alimentationId || !type || !userId) {
      return NextResponse.json({
        success: false,
        message: 'Fichier, ID alimentation, type et userId requis'
      }, { status: 400 });
    }

    // Validation du type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Type de fichier non autorisé. Seuls PDF, JPEG, PNG et DOCX sont acceptés.'
      }, { status: 400 });
    }

    // Validation de la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 10MB'
      }, { status: 400 });
    }

    // Créer le répertoire s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'alimentations', alimentationId);
    await mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL relative pour accéder au fichier
    const fileUrl = `/uploads/alimentations/${alimentationId}/${fileName}`;

    // Enregistrer dans la base de données
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const document = await prisma.documentAlimentation.create({
        data: {
          alimentationId,
          type,
          nom: file.name,
          url: fileUrl,
          taille: file.size,
          mimeType: file.type,
          uploadedBy: userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Document uploadé avec succès',
        data: document,
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'upload du document'
    }, { status: 500 });
  }
}
