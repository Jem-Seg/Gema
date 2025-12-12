import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const alimentationId = formData.get('alimentationId') as string;
    const type = formData.get('type') as string;
    const userId = formData.get('userId') as string;

    if (!file || !alimentationId || !type || !userId) {
      return NextResponse.json({
        success: false,
        message: 'Fichier, ID alimentation, type et userId requis'
      }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Type de fichier non autorisé. Seuls PDF, JPEG, PNG et DOCX sont acceptés.'
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 10MB'
      }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'alimentations', alimentationId);
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/alimentations/${alimentationId}/${fileName}`;

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
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'upload du document'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
