import os from 'os';
import path from 'path';

/**
 * Obtenir le chemin du dossier de stockage des uploads selon l'environnement
 * 
 * Développement (SQLite) : ./public/uploads (dans le projet)
 * Production (PostgreSQL) : Dossier externe persistant
 *   - Windows : C:\gestock\uploads
 *   - macOS/Linux : ~/gestock/uploads
 */
export function getUploadsDir(): string {
  // En développement ou si variable spécifiée, utiliser le dossier local
  if (process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_UPLOADS === 'true') {
    return path.join(process.cwd(), 'public', 'uploads');
  }

  // En production, utiliser dossier externe
  if (process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR;
  }

  // Chemin par défaut selon OS
  if (process.platform === 'win32') {
    return 'C:\\gestock\\uploads';
  }

  // macOS et Linux
  const homeDir = os.homedir();
  return path.join(homeDir, 'gestock', 'uploads');
}

/**
 * Obtenir le chemin public pour accéder aux uploads via API
 */
export function getPublicUploadPath(filename: string): string {
  return `/uploads/${filename}`;
}

/**
 * Vérifier si on utilise le stockage local (dans public/) ou externe
 */
export function isLocalStorage(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_UPLOADS === 'true';
}
