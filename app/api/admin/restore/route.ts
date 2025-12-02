import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { restoreBackup, getLatestBackup } from '@/lib/backup';

/**
 * POST - Restaurer une sauvegarde
 * Body: { backupFilePath?: string, useLatest?: boolean }
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
    const { backupFilePath, useLatest } = body;

    let targetBackupPath = backupFilePath;

    // Si useLatest est true, obtenir la dernière sauvegarde
    if (useLatest) {
      const latestBackup = await getLatestBackup();
      if (!latestBackup) {
        return NextResponse.json(
          { success: false, message: 'Aucune sauvegarde disponible' },
          { status: 404 }
        );
      }
      targetBackupPath = latestBackup.filePath;
    }

    if (!targetBackupPath) {
      return NextResponse.json(
        { success: false, message: 'Fichier de sauvegarde requis' },
        { status: 400 }
      );
    }

    // ATTENTION: La restauration va écraser toutes les données actuelles
    console.warn(`[Restore API] RESTAURATION INITIÉE par ${currentUser.email} - Fichier: ${targetBackupPath}`);

    const result = await restoreBackup(targetBackupPath);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error('POST /api/admin/restore error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur'
      },
      { status: 500 }
    );
  }
}
