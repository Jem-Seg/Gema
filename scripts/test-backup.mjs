#!/usr/bin/env node

/**
 * Script de test pour la fonctionnalité de sauvegarde
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🔍 Configuration détectée:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('BACKUP_DIR:', process.env.BACKUP_DIR || 'Non défini (utilise default)');
console.log('Platform:', process.platform);
console.log('Home:', process.env.HOME || process.env.USERPROFILE);

// Importer dynamiquement le module de sauvegarde
async function testBackup() {
  try {
    // Note: Nous ne pouvons pas importer directement lib/backup.ts en .mjs
    // Cette version affiche juste la configuration
    
    console.log('\n✅ Configuration affichée avec succès');
    console.log('\nℹ️  Pour tester la sauvegarde:');
    console.log('1. Démarrez l\'application: npm run dev');
    console.log('2. Connectez-vous en tant qu\'admin');
    console.log('3. Allez sur /admin/backup');
    console.log('4. Cliquez sur "Créer Sauvegarde"');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testBackup();
