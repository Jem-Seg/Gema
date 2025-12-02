import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import logger from '@/lib/logger';

/**
 * GET - Obtenir les statistiques ou le contenu des logs
 * Query params: ?action=stats|list|read&file=filename&lines=100
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const isAdmin = 'isAdmin' in currentUser && currentUser.isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Accès refusé - Administrateur requis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats': {
        const stats = await logger.getStats();
        return NextResponse.json({
          success: true,
          data: stats
        });
      }

      case 'list': {
        const stats = await logger.getStats();
        return NextResponse.json({
          success: true,
          data: stats.files
        });
      }

      case 'read': {
        const fileName = searchParams.get('file');
        const lines = parseInt(searchParams.get('lines') || '100');

        if (!fileName) {
          return NextResponse.json(
            { success: false, message: 'Nom de fichier requis' },
            { status: 400 }
          );
        }

        const logLines = await logger.readLogFile(fileName, lines);
        return NextResponse.json({
          success: true,
          data: {
            fileName,
            lines: logLines,
            totalLines: logLines.length
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('API', 'Erreur API logs', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}
