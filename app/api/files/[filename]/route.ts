import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { getUploadsDir } from '@/lib/uploads';
import logger from '@/lib/logger';

/**
 * Route API pour servir les fichiers uploadés depuis le dossier externe
 * Cette route remplace l'accès direct à /public/uploads en production
 * 
 * GET /api/files/[filename]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    if (!filename) {
      return new NextResponse('Nom de fichier manquant', { status: 400 });
    }

    // Sécurité : empêcher l'accès aux fichiers en dehors du dossier uploads
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      logger.warn('Uploads', 'Tentative accès fichier non autorisé', { filename });
      return new NextResponse('Accès non autorisé', { status: 403 });
    }

    const uploadsDir = getUploadsDir();
    const filePath = join(uploadsDir, filename);

    if (!existsSync(filePath)) {
      logger.warn('Uploads', 'Fichier non trouvé', { filename, path: filePath });
      return new NextResponse('Fichier non trouvé', { status: 404 });
    }

    // Lire le fichier
    const fileBuffer = await readFile(filePath);

    // Déterminer le type MIME selon l'extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    // Retourner le fichier avec les headers appropriés
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });

  } catch (error) {
    logger.error('Uploads', 'Erreur lecture fichier', error);
    return new NextResponse('Erreur serveur', { status: 500 });
  }
}
