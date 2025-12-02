import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import {
  createBackup,
  listBackups,
  getBackupStats,
  checkBackupConfig,
  cleanOldBackups,
  deleteBackup
} from '@/lib/backup';

/**
 * GET - Lister les sauvegardes ou obtenir les statistiques
 * Query params: ?action=list|stats|check
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

    // Seuls les admins peuvent gérer les sauvegardes
    const isAdmin = 'isAdmin' in currentUser && currentUser.isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Accès refusé - Administrateur requis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list': {
        const backups = await listBackups();
        return NextResponse.json({
          success: true,
          data: backups.map(b => ({
            fileName: b.fileName,
            filePath: b.filePath,
            size: b.size,
            sizeMB: (b.size / (1024 * 1024)).toFixed(2),
            createdAt: b.createdAt,
            ageHours: b.ageHours.toFixed(1),
            ageDays: (b.ageHours / 24).toFixed(1)
          }))
        });
      }

      case 'stats': {
        const stats = await getBackupStats();
        return NextResponse.json({
          success: true,
          data: stats
        });
      }

      case 'check': {
        const config = await checkBackupConfig();
        return NextResponse.json({
          success: true,
          data: config
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET /api/admin/backup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Créer une nouvelle sauvegarde ou nettoyer les anciennes
 * Body: { action: 'create' | 'clean' }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, retentionDays, keepLast, backupFilePath } = body;

    switch (action) {
      case 'create': {
        const result = await createBackup();
        return NextResponse.json(result, { 
          status: result.success ? 200 : 500 
        });
      }

      case 'clean': {
        const result = await cleanOldBackups(retentionDays, keepLast);
        const message = result.deletedCount > 0
          ? `${result.deletedCount} sauvegarde(s) supprimée(s), ${result.freedSpaceMB} MB libérés`
          : 'Aucune sauvegarde à nettoyer';
        return NextResponse.json({
          success: true,
          message,
          data: result
        });
      }

      case 'delete': {
        if (!backupFilePath) {
          return NextResponse.json(
            { success: false, message: 'Chemin de sauvegarde requis' },
            { status: 400 }
          );
        }
        const result = await deleteBackup(backupFilePath);
        return NextResponse.json(result, {
          status: result.success ? 200 : 500
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/admin/backup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur serveur' 
      },
      { status: 500 }
    );
  }
}
