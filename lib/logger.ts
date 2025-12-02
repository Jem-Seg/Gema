import fs from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Niveaux de log disponibles
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * Configuration du logger
 */
interface LoggerConfig {
  level: LogLevel;
  logDir: string;
  maxFileSize: number; // en MB
  maxFiles: number;
  enableConsole: boolean;
  enableFile: boolean;
}

/**
 * Entrée de log
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  userId?: string;
  userEmail?: string;
}

class Logger {
  private config: LoggerConfig;
  private currentLogFile: string;
  private logStream: fs.WriteStream | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    const defaultConfig: LoggerConfig = {
      level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
      maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10'), // 10 MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '30'), // 30 fichiers
      enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
      enableFile: process.env.LOG_ENABLE_FILE !== 'false'
    };

    this.config = { ...defaultConfig, ...config };
    this.currentLogFile = this.getLogFilePath();

    // Créer le dossier de logs si nécessaire
    if (this.config.enableFile && !existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }

    // Initialiser le stream de fichier
    if (this.config.enableFile) {
      this.initLogStream();
    }
  }

  /**
   * Obtenir le chemin du fichier de log actuel
   */
  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.config.logDir, `app-${date}.log`);
  }

  /**
   * Initialiser le stream de fichier
   */
  private initLogStream(): void {
    if (this.logStream) {
      this.logStream.end();
    }

    this.logStream = fs.createWriteStream(this.currentLogFile, {
      flags: 'a', // append
      encoding: 'utf8'
    });
  }

  /**
   * Vérifier et effectuer la rotation si nécessaire
   */
  private async checkRotation(): Promise<void> {
    if (!this.config.enableFile) return;

    const newLogFile = this.getLogFilePath();

    // Changer de fichier si on change de jour
    if (newLogFile !== this.currentLogFile) {
      this.currentLogFile = newLogFile;
      this.initLogStream();
    }

    // Vérifier la taille du fichier
    if (existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB > this.config.maxFileSize) {
        // Renommer le fichier actuel avec un timestamp
        const timestamp = new Date().getTime();
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);
        this.initLogStream();
      }
    }

    // Nettoyer les anciens fichiers
    await this.cleanOldLogs();
  }

  /**
   * Nettoyer les anciens fichiers de log
   */
  private async cleanOldLogs(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.config.logDir, f),
          mtime: fs.statSync(path.join(this.config.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime); // Plus récent en premier

      // Supprimer les fichiers au-delà de maxFiles
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error) {
      console.error('Erreur nettoyage logs:', error);
    }
  }

  /**
   * Vérifier si un niveau de log doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  /**
   * Formater une entrée de log
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      `[${entry.category}]`,
      entry.message
    ];

    if (entry.userId) {
      parts.push(`- User: ${entry.userId}`);
    }

    if (entry.userEmail) {
      parts.push(`(${entry.userEmail})`);
    }

    if (entry.data !== undefined) {
      try {
        const dataStr = typeof entry.data === 'string' 
          ? entry.data 
          : JSON.stringify(entry.data, null, 2);
        parts.push(`\nData: ${dataStr}`);
      } catch {
        parts.push(`\nData: [Non sérialisable]`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Obtenir la couleur de console selon le niveau
   */
  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m'; // Vert
      case LogLevel.WARN: return '\x1b[33m'; // Jaune
      case LogLevel.ERROR: return '\x1b[31m'; // Rouge
      case LogLevel.FATAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }

  /**
   * Écrire une entrée de log
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLogEntry(entry);

    // Console
    if (this.config.enableConsole) {
      const color = this.getConsoleColor(entry.level);
      const reset = '\x1b[0m';
      console.log(`${color}${formattedLog}${reset}`);
    }

    // Fichier
    if (this.config.enableFile && this.logStream) {
      await this.checkRotation();
      this.logStream.write(formattedLog + '\n');
    }
  }

  /**
   * Log de debug
   */
  debug(category: string, message: string, data?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      category,
      message,
      data
    });
  }

  /**
   * Log d'information
   */
  info(category: string, message: string, data?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      data
    });
  }

  /**
   * Log d'avertissement
   */
  warn(category: string, message: string, data?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      data
    });
  }

  /**
   * Log d'erreur
   */
  error(category: string, message: string, error?: unknown): void {
    const errorData = error instanceof Error 
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : error;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      data: errorData
    });
  }

  /**
   * Log d'erreur fatale
   */
  fatal(category: string, message: string, error?: unknown): void {
    const errorData = error instanceof Error 
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : error;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      category,
      message,
      data: errorData
    });
  }

  /**
   * Log avec contexte utilisateur
   */
  logWithUser(
    level: LogLevel,
    category: string,
    message: string,
    userId?: string,
    userEmail?: string,
    data?: unknown
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId,
      userEmail
    });
  }

  /**
   * Fermer proprement le logger
   */
  close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  /**
   * Obtenir les statistiques des logs
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSizeMB: number;
    oldestLog: string | null;
    newestLog: string | null;
    files: Array<{ name: string; sizeMB: number; date: Date }>;
  }> {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => {
          const filePath = path.join(this.config.logDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            sizeMB: parseFloat((stats.size / (1024 * 1024)).toFixed(2)),
            date: stats.mtime
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const totalSizeMB = files.reduce((sum, f) => sum + f.sizeMB, 0);

      return {
        totalFiles: files.length,
        totalSizeMB: parseFloat(totalSizeMB.toFixed(2)),
        oldestLog: files.length > 0 ? files[files.length - 1].name : null,
        newestLog: files.length > 0 ? files[0].name : null,
        files
      };
    } catch (error) {
      this.error('Logger', 'Erreur récupération statistiques logs', error);
      return {
        totalFiles: 0,
        totalSizeMB: 0,
        oldestLog: null,
        newestLog: null,
        files: []
      };
    }
  }

  /**
   * Lire les dernières lignes d'un fichier de log
   */
  async readLogFile(fileName: string, lines: number = 100): Promise<string[]> {
    try {
      const filePath = path.join(this.config.logDir, fileName);
      if (!existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());
      
      return allLines.slice(-lines);
    } catch (error) {
      this.error('Logger', 'Erreur lecture fichier log', error);
      return [];
    }
  }
}

// Instance singleton du logger
const logger = new Logger();

// Fermer proprement à la fin du processus
process.on('exit', () => {
  logger.close();
});

process.on('SIGINT', () => {
  logger.close();
  process.exit(0);
});

export default logger;
export { Logger };
