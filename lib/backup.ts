import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import os from 'os';

const execAsync = promisify(exec);

// Déterminer le type de base de données depuis DATABASE_URL
const getDatabaseType = (): 'postgresql' | 'sqlite' => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgresql';
  }
  if (dbUrl.startsWith('file:')) {
    return 'sqlite';
  }
  // Par défaut, assumer PostgreSQL pour compatibilité
  return 'postgresql';
};

// Déterminer le chemin par défaut selon l'OS
const getDefaultBackupDir = (): string => {
  if (process.env.BACKUP_DIR) {
    return process.env.BACKUP_DIR;
  }
  
  // Windows
  if (process.platform === 'win32') {
    return 'C:\\gestock\\backups';
  }
  
  // macOS et Linux - utiliser le répertoire home de l'utilisateur
  const homeDir = os.homedir();
  return path.join(homeDir, 'gestock', 'backups');
};

// Configuration depuis variables d'environnement
const DB_TYPE = getDatabaseType();
const BACKUP_DIR = getDefaultBackupDir();
const DB_NAME = process.env.DATABASE_NAME || 'gestock_prod';
const DB_USER = process.env.DATABASE_USER || 'gestock_user';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '5432';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

// Pour SQLite, extraire le chemin du fichier de DATABASE_URL
const getSQLitePath = (): string => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:')) {
    return dbUrl.replace('file:', '');
  }
  return './prisma/dev.db';
};

interface BackupInfo {
  fileName: string;
  filePath: string;
  size: number;
  createdAt: Date;
  ageHours: number;
}

/**
 * Créer une sauvegarde de la base de données (SQLite ou PostgreSQL)
 */
export async function createBackup(): Promise<{ success: boolean; message: string; filePath?: string }> {
  try {
    // Créer le dossier de sauvegarde si nécessaire
    const monthFolder = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthBackupDir = path.join(BACKUP_DIR, monthFolder);
    
    if (!existsSync(monthBackupDir)) {
      await fs.mkdir(monthBackupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const startTime = Date.now();

    let backupFilePath: string;
    let sizeMB: string;

    if (DB_TYPE === 'sqlite') {
      // Sauvegarde SQLite - simple copie du fichier
      const sqlitePath = getSQLitePath();
      const sqliteFullPath = path.resolve(sqlitePath);
      
      if (!existsSync(sqliteFullPath)) {
        throw new Error(`Fichier SQLite introuvable: ${sqliteFullPath}`);
      }

      const backupFileName = `gestock_sqlite_${timestamp}.db`;
      backupFilePath = path.join(monthBackupDir, backupFileName);

      console.log(`[Backup] Création sauvegarde SQLite: ${backupFileName}`);
      console.log(`[Backup] Source: ${sqliteFullPath}`);
      console.log(`[Backup] Destination: ${backupFilePath}`);

      // Copier le fichier SQLite
      await fs.copyFile(sqliteFullPath, backupFilePath);

      // Vérifier la copie
      if (!existsSync(backupFilePath)) {
        throw new Error('Fichier de sauvegarde non créé');
      }

      const stats = await fs.stat(backupFilePath);
      sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    } else {
      // Sauvegarde PostgreSQL avec pg_dump
      const backupFileName = `${DB_NAME}_${timestamp}.backup`;
      backupFilePath = path.join(monthBackupDir, backupFileName);

      const pgDumpCommand = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} --format=custom --file="${backupFilePath}"`;

      console.log(`[Backup] Création sauvegarde PostgreSQL: ${backupFileName}`);

      await execAsync(pgDumpCommand, {
        env: {
          ...process.env,
          PGPASSWORD: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || ''
        }
      });

      if (!existsSync(backupFilePath)) {
        throw new Error('Fichier de sauvegarde non créé');
      }

      const stats = await fs.stat(backupFilePath);
      sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    }

    const duration = Date.now() - startTime;
    console.log(`[Backup] ✓ Sauvegarde créée - Taille: ${sizeMB} MB - Durée: ${(duration / 1000).toFixed(2)}s`);

    // Nettoyer les anciennes sauvegardes
    await cleanOldBackups();

    return {
      success: true,
      message: `Sauvegarde créée avec succès (${sizeMB} MB)`,
      filePath: backupFilePath
    };
  } catch (error) {
    console.error('[Backup] Erreur:', error);
    return {
      success: false,
      message: `Erreur lors de la création de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Lister toutes les sauvegardes disponibles
 */
export async function listBackups(): Promise<BackupInfo[]> {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return [];
    }

    const backups: BackupInfo[] = [];
    
    // Parcourir tous les sous-dossiers (par mois)
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const monthDir = path.join(BACKUP_DIR, entry.name);
        const files = await fs.readdir(monthDir);
        
        for (const file of files) {
          // Accepter .backup (PostgreSQL), .sql, et .db (SQLite)
          if (file.endsWith('.backup') || file.endsWith('.sql') || file.endsWith('.db')) {
            const filePath = path.join(monthDir, file);
            try {
              const stats = await fs.stat(filePath);
              const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
              
              backups.push({
                fileName: file,
                filePath: filePath,
                size: stats.size,
                createdAt: stats.mtime,
                ageHours: ageHours
              });
            } catch (err) {
              console.warn(`[Backup] Impossible de lire le fichier ${filePath}:`, err);
            }
          }
        }
      }
    }

    // Trier par date (plus récent en premier)
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return backups;
  } catch (error) {
    console.error('[Backup] Erreur listage sauvegardes:', error);
    return [];
  }
}

/**
 * Obtenir la dernière sauvegarde
 */
export async function getLatestBackup(): Promise<BackupInfo | null> {
  const backups = await listBackups();
  return backups.length > 0 ? backups[0] : null;
}

/**
 * Restaurer une sauvegarde (SQLite ou PostgreSQL)
 */
export async function restoreBackup(backupFilePath: string): Promise<{ success: boolean; message: string }> {
  try {
    // Vérifier que le fichier existe
    if (!existsSync(backupFilePath)) {
      return {
        success: false,
        message: 'Fichier de sauvegarde introuvable'
      };
    }

    console.log(`[Restore] Démarrage restauration depuis: ${backupFilePath}`);

    // Créer une sauvegarde de sécurité avant restauration
    console.log('[Restore] Création sauvegarde de sécurité...');
    const securityBackup = await createBackup();
    if (!securityBackup.success) {
      console.warn('[Restore] Impossible de créer sauvegarde de sécurité');
    }

    const startTime = Date.now();

    if (DB_TYPE === 'sqlite') {
      // Restauration SQLite - remplacer le fichier actuel
      const sqlitePath = getSQLitePath();
      const sqliteFullPath = path.resolve(sqlitePath);

      console.log(`[Restore] Restauration SQLite vers: ${sqliteFullPath}`);

      // Remplacer le fichier SQLite
      await fs.copyFile(backupFilePath, sqliteFullPath);

      const duration = Date.now() - startTime;
      console.log(`[Restore] ✓ Restauration terminée - Durée: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        message: `Base de données restaurée avec succès (${(duration / 1000).toFixed(2)}s)`
      };

    } else {
      // Restauration PostgreSQL
      console.log('[Restore] Fermeture des connexions actives...');
      const killConnectionsSQL = `
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${DB_NAME}'
          AND pid <> pg_backend_pid();
      `;
      
      try {
        await execAsync(`psql -U postgres -h ${DB_HOST} -p ${DB_PORT} -c "${killConnectionsSQL.replace(/\n/g, ' ')}"`, {
          env: {
            ...process.env,
            PGPASSWORD: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || ''
          }
        });
      } catch {
        console.warn('[Restore] Avertissement fermeture connexions');
      }

      console.log('[Restore] Suppression et recréation de la base de données...');
      
      await execAsync(`psql -U postgres -h ${DB_HOST} -p ${DB_PORT} -c "DROP DATABASE IF EXISTS ${DB_NAME}"`, {
        env: {
          ...process.env,
          PGPASSWORD: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || ''
        }
      });

      await execAsync(`psql -U postgres -h ${DB_HOST} -p ${DB_PORT} -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}"`, {
        env: {
          ...process.env,
          PGPASSWORD: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || ''
        }
      });

      console.log('[Restore] Restauration des données...');
      const pgRestoreCommand = `pg_restore -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} --clean --if-exists "${backupFilePath}"`;

      await execAsync(pgRestoreCommand, {
        env: {
          ...process.env,
          PGPASSWORD: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || ''
        }
      });

      const duration = Date.now() - startTime;
      console.log(`[Restore] ✓ Restauration terminée - Durée: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        message: `Base de données restaurée avec succès (${(duration / 1000).toFixed(2)}s)`
      };
    }
  } catch (error) {
    console.error('[Restore] Erreur:', error);
    return {
      success: false,
      message: `Erreur lors de la restauration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Nettoyer les anciennes sauvegardes (> retentionDays jours)
 * @param retentionDays Nombre de jours à conserver (par défaut: RETENTION_DAYS)
 * @param keepLast Nombre minimal de sauvegardes à conserver même si anciennes
 */
export async function cleanOldBackups(
  retentionDays?: number, 
  keepLast: number = 3
): Promise<{ deletedCount: number; freedSpaceMB: number }> {
  try {
    const backups = await listBackups();
    const daysToKeep = retentionDays !== undefined ? retentionDays : RETENTION_DAYS;
    const cutoffHours = daysToKeep * 24;
    
    console.log(`[Backup] Nettoyage des sauvegardes > ${daysToKeep} jours (conservation des ${keepLast} dernières)`);
    
    let deletedCount = 0;
    let freedSpace = 0;

    // Trier par date (plus récent en premier)
    const sortedBackups = [...backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (let i = 0; i < sortedBackups.length; i++) {
      const backup = sortedBackups[i];
      
      // Toujours conserver les N dernières sauvegardes
      if (i < keepLast) {
        console.log(`[Backup] Conservation (${i + 1}/${keepLast} récentes): ${backup.fileName}`);
        continue;
      }
      
      // Supprimer si plus ancienne que la rétention
      if (backup.ageHours > cutoffHours) {
        try {
          await fs.unlink(backup.filePath);
          deletedCount++;
          freedSpace += backup.size;
          console.log(`[Backup] ✓ Supprimé: ${backup.fileName} (${(backup.ageHours / 24).toFixed(1)} jours)`);
        } catch (err) {
          console.error(`[Backup] Erreur suppression ${backup.fileName}:`, err);
        }
      } else {
        console.log(`[Backup] Conservation (< ${daysToKeep} jours): ${backup.fileName} (${(backup.ageHours / 24).toFixed(1)} jours)`);
      }
    }

    const freedSpaceMB = (freedSpace / (1024 * 1024)).toFixed(2);
    
    if (deletedCount > 0) {
      console.log(`[Backup] ✓ Nettoyage terminé: ${deletedCount} fichiers supprimés, ${freedSpaceMB} MB libérés`);
    } else {
      console.log(`[Backup] ℹ️  Aucune sauvegarde à nettoyer (${backups.length} sauvegardes, toutes < ${daysToKeep} jours ou dans les ${keepLast} dernières)`);
    }

    return {
      deletedCount,
      freedSpaceMB: parseFloat(freedSpaceMB)
    };
  } catch (error) {
    console.error('[Backup] Erreur nettoyage:', error);
    return { deletedCount: 0, freedSpaceMB: 0 };
  }
}

/**
 * Supprimer une sauvegarde spécifique
 */
export async function deleteBackup(backupFilePath: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!existsSync(backupFilePath)) {
      return {
        success: false,
        message: 'Fichier de sauvegarde introuvable'
      };
    }

    const stats = await fs.stat(backupFilePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    await fs.unlink(backupFilePath);
    
    console.log(`[Backup] ✓ Sauvegarde supprimée: ${path.basename(backupFilePath)} (${sizeMB} MB)`);

    return {
      success: true,
      message: `Sauvegarde supprimée avec succès (${sizeMB} MB libérés)`
    };
  } catch (error) {
    console.error('[Backup] Erreur suppression:', error);
    return {
      success: false,
      message: `Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    };
  }
}

/**
 * Obtenir les statistiques des sauvegardes
 */
export async function getBackupStats(): Promise<{
  totalBackups: number;
  totalSizeMB: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
}> {
  try {
    const backups = await listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSizeMB: 0,
        oldestBackup: null,
        newestBackup: null
      };
    }

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    
    return {
      totalBackups: backups.length,
      totalSizeMB: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
      oldestBackup: backups[backups.length - 1].createdAt,
      newestBackup: backups[0].createdAt
    };
  } catch (error) {
    console.error('[Backup] Erreur stats:', error);
    return {
      totalBackups: 0,
      totalSizeMB: 0,
      oldestBackup: null,
      newestBackup: null
    };
  }
}

/**
 * Vérifier la configuration de sauvegarde
 */
export async function checkBackupConfig(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dbType: string;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier que le dossier de sauvegarde existe ou peut être créé
  try {
    if (!existsSync(BACKUP_DIR)) {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      warnings.push(`Dossier de sauvegarde créé: ${BACKUP_DIR}`);
    }
  } catch {
    errors.push(`Impossible de créer le dossier de sauvegarde: ${BACKUP_DIR}`);
  }

  if (DB_TYPE === 'sqlite') {
    // Vérifier que le fichier SQLite existe
    const sqlitePath = getSQLitePath();
    const sqliteFullPath = path.resolve(sqlitePath);
    
    if (!existsSync(sqliteFullPath)) {
      errors.push(`Fichier SQLite introuvable: ${sqliteFullPath}`);
    } else {
      warnings.push(`Base de données SQLite détectée: ${sqliteFullPath}`);
    }
  } else {
    // Vérifier pg_dump pour PostgreSQL
    try {
      await execAsync('pg_dump --version');
    } catch {
      errors.push('pg_dump non trouvé - PostgreSQL doit être installé et dans le PATH');
    }

    // Vérifier pg_restore
    try {
      await execAsync('pg_restore --version');
    } catch {
      errors.push('pg_restore non trouvé - PostgreSQL doit être installé et dans le PATH');
    }

    // Vérifier les variables d'environnement
    if (!process.env.DATABASE_PASSWORD && !process.env.PGPASSWORD) {
      warnings.push('Variable PGPASSWORD ou DATABASE_PASSWORD non définie - la sauvegarde peut échouer');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dbType: DB_TYPE
  };
}
