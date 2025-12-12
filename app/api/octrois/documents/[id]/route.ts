import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const document = await prisma.documentOctroi.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({
        success: false,
        message: 'Document introuvable'
      }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', document.url);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    await prisma.documentOctroi.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la suppression du document'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const document = await prisma.documentOctroi.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({
        success: false,
        message: 'Document introuvable'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la récupération du document'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
