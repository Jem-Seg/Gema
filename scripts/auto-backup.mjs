/**
 * Script de sauvegarde automatique pour Windows
 * À exécuter avec node-schedule ou Task Scheduler
 * 
 * Usage:
 *   node scripts/auto-backup.mjs
 * 
 * Configuration via variables d'environnement:
 *   - BACKUP_DIR: Dossier des sauvegardes
 *   - DATABASE_NAME: Nom de la base de données
 *   - DATABASE_USER: Utilisateur PostgreSQL
 *   - DATABASE_PASSWORD ou PGPASSWORD: Mot de passe
 *   - BACKUP_RETENTION_DAYS: Durée de conservation (défaut: 30 jours)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || 'C:\\gestock\\backups';
const DB_NAME = process.env.DATABASE_NAME || 'gestock_prod';
const DB_USER = process.env.DATABASE_USER || 'gestock_user';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '5432';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

// Log avec timestamp
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'ERROR' ? '❌' : level === 'SUCCESS' ? '✓' : level === 'WARNING' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} [${level}] ${message}`);
}

// Créer une sauvegarde
async function createBackup() {
  try {
    log('Démarrage sauvegarde automatique PostgreSQL');

    // Créer le dossier de sauvegarde
    const monthFolder = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthBackupDir = path.join(BACKUP_DIR, monthFolder);
    
    if (!existsSync(monthBackupDir)) {
      await fs.mkdir(monthBackupDir, { recursive: true });
      log(`Dossier créé: ${monthBackupDir}`);
    }

    // Nom du fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `${DB_NAME}_${timestamp}.backup`;
    const backupFilePath = path.join(monthBackupDir, backupFileName);

    // Vérifier pg_dump
    try {
      await execAsync('pg_dump --version');
    } catch (err) {
      log('pg_dump non trouvé dans PATH - Vérifiez l\'installation PostgreSQL', 'ERROR');
      process.exit(1);
    }

    // Créer la sauvegarde
    log(`Création: ${backupFileName}`);
    const startTime = Date.now();

    const pgDumpCommand = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} --format=custom --file="${backupFilePath}"`;

    await execAsync(pgDumpCommand, {
      env: {
        ...process.env,
        PGPASSWORD: process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || ''
      }
    });

    const duration = Date.now() - startTime;

    // Vérifier le fichier
    if (!existsSync(backupFilePath)) {
      throw new Error('Fichier de sauvegarde non créé');
    }

    const stats = await fs.stat(backupFilePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    log(`Sauvegarde réussie - Taille: ${sizeMB} MB - Durée: ${(duration / 1000).toFixed(2)}s`, 'SUCCESS');

    // Nettoyer les anciennes sauvegardes
    await cleanOldBackups();

    return { success: true, filePath: backupFilePath, sizeMB };
  } catch (error) {
    log(`Erreur création sauvegarde: ${error.message}`, 'ERROR');
    return { success: false, error: error.message };
  }
}

// Nettoyer les anciennes sauvegardes
async function cleanOldBackups() {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return { deletedCount: 0, freedSpaceMB: 0 };
    }

    log(`Nettoyage sauvegardes > ${RETENTION_DAYS} jours`);

    const cutoffDate = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    let freedSpace = 0;

    // Parcourir tous les sous-dossiers
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const monthDir = path.join(BACKUP_DIR, entry.name);
        const files = await fs.readdir(monthDir);

        for (const file of files) {
          if (file.endsWith('.backup') || file.endsWith('.sql')) {
            const filePath = path.join(monthDir, file);
            const stats = await fs.stat(filePath);

            if (stats.mtime.getTime() < cutoffDate) {
              freedSpace += stats.size;
              await fs.unlink(filePath);
              deletedCount++;
              log(`Supprimé: ${file} (${((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)} jours)`);
            }
          }
        }
      }
    }

    const freedSpaceMB = (freedSpace / (1024 * 1024)).toFixed(2);

    if (deletedCount > 0) {
      log(`Nettoyage terminé: ${deletedCount} fichiers, ${freedSpaceMB} MB libérés`, 'SUCCESS');
    } else {
      log('Aucune sauvegarde à nettoyer');
    }

    return { deletedCount, freedSpaceMB: parseFloat(freedSpaceMB) };
  } catch (error) {
    log(`Erreur nettoyage: ${error.message}`, 'WARNING');
    return { deletedCount: 0, freedSpaceMB: 0 };
  }
}

// Obtenir les statistiques
async function getStats() {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return { totalBackups: 0, totalSizeMB: 0 };
    }

    let totalBackups = 0;
    let totalSize = 0;

    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const monthDir = path.join(BACKUP_DIR, entry.name);
        const files = await fs.readdir(monthDir);

        for (const file of files) {
          if (file.endsWith('.backup') || file.endsWith('.sql')) {
            const filePath = path.join(monthDir, file);
            const stats = await fs.stat(filePath);
            totalBackups++;
            totalSize += stats.size;
          }
        }
      }
    }

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    log(`Statistiques: ${totalBackups} sauvegardes, ${totalSizeMB} MB`);

    return { totalBackups, totalSizeMB: parseFloat(totalSizeMB) };
  } catch (error) {
    log(`Erreur statistiques: ${error.message}`, 'WARNING');
    return { totalBackups: 0, totalSizeMB: 0 };
  }
}

// Exécution principale
(async () => {
  log('═══════════════════════════════════════════════════');
  log('   GeStock - Sauvegarde Automatique PostgreSQL    ');
  log('═══════════════════════════════════════════════════');
  log(`Base de données: ${DB_NAME}`);
  log(`Dossier: ${BACKUP_DIR}`);
  log(`Rétention: ${RETENTION_DAYS} jours`);
  log('═══════════════════════════════════════════════════');

  const result = await createBackup();

  if (result.success) {
    await getStats();
    log('═══════════════════════════════════════════════════');
    log('Sauvegarde automatique terminée avec succès', 'SUCCESS');
    log('═══════════════════════════════════════════════════');
    process.exit(0);
  } else {
    log('═══════════════════════════════════════════════════');
    log('Sauvegarde automatique ÉCHOUÉE', 'ERROR');
    log('═══════════════════════════════════════════════════');
    process.exit(1);
  }
})();
