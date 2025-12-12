import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;

    // Vérifier l'authentification
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Construire le chemin du fichier
    const filePath = path.join('/');
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);

    // Vérifier que le fichier existe
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le chemin ne sort pas du dossier uploads (sécurité)
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Lire le fichier
    const fileBuffer = await readFile(fullPath);

    // Déterminer le type MIME
    const extension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    if (extension && mimeTypes[extension]) {
      contentType = mimeTypes[extension];
    }

    // Retourner le fichier
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
