/**
 * Script de vérification de la configuration des uploads
 * Exécuter avec : node scripts/check-uploads-config.mjs
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import os from 'os';

console.log('========================================');
console.log('  Vérification Configuration Uploads');
console.log('========================================\n');

// 1. Détecter l'environnement
const nodeEnv = process.env.NODE_ENV || 'development';
const useLocalUploads = process.env.USE_LOCAL_UPLOADS === 'true';

console.log(`[1] Environnement détecté:`);
console.log(`    NODE_ENV: ${nodeEnv}`);
console.log(`    USE_LOCAL_UPLOADS: ${useLocalUploads || 'false'}`);
console.log();

// 2. Déterminer le chemin uploads
let uploadsDir;

if (nodeEnv === 'development' || useLocalUploads) {
  uploadsDir = join(process.cwd(), 'public', 'uploads');
  console.log(`[2] Mode: DÉVELOPPEMENT (stockage local)`);
} else if (process.env.UPLOADS_DIR) {
  uploadsDir = process.env.UPLOADS_DIR;
  console.log(`[2] Mode: PRODUCTION (variable UPLOADS_DIR)`);
} else if (process.platform === 'win32') {
  uploadsDir = 'C:\\gestock\\uploads';
  console.log(`[2] Mode: PRODUCTION Windows (dossier externe)`);
} else {
  const homeDir = os.homedir();
  uploadsDir = join(homeDir, 'gestock', 'uploads');
  console.log(`[2] Mode: PRODUCTION macOS/Linux (dossier externe)`);
}

console.log(`    Chemin: ${uploadsDir}`);
console.log();

// 3. Vérifier l'existence du dossier
console.log(`[3] Vérification dossier uploads...`);
if (!existsSync(uploadsDir)) {
  console.log(`    ❌ Dossier inexistant`);
  console.log(`    Création du dossier...`);
  try {
    mkdirSync(uploadsDir, { recursive: true });
    console.log(`    ✅ Dossier créé avec succès`);
  } catch (error) {
    console.error(`    ❌ ERREUR: Impossible de créer le dossier`);
    console.error(`    ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`    ✅ Dossier existe`);
}
console.log();

// 4. Test écriture
console.log(`[4] Test permissions écriture...`);
const testFile = join(uploadsDir, '.test-write');
try {
  writeFileSync(testFile, 'test');
  console.log(`    ✅ Écriture OK`);
} catch (error) {
  console.error(`    ❌ ERREUR: Impossible d'écrire dans le dossier`);
  console.error(`    ${error.message}`);
  process.exit(1);
}

// 5. Test lecture
console.log(`[5] Test permissions lecture...`);
try {
  const content = readFileSync(testFile, 'utf-8');
  if (content === 'test') {
    console.log(`    ✅ Lecture OK`);
  } else {
    throw new Error('Contenu incorrect');
  }
} catch (error) {
  console.error(`    ❌ ERREUR: Impossible de lire le fichier`);
  console.error(`    ${error.message}`);
  process.exit(1);
}

// 6. Test suppression
console.log(`[6] Test permissions suppression...`);
try {
  unlinkSync(testFile);
  console.log(`    ✅ Suppression OK`);
} catch (error) {
  console.error(`    ❌ ERREUR: Impossible de supprimer le fichier`);
  console.error(`    ${error.message}`);
  process.exit(1);
}
console.log();

// 7. Compter fichiers existants
console.log(`[7] Analyse contenu...`);
try {
  const { readdirSync } = await import('fs');
  const files = readdirSync(uploadsDir);
  const imageFiles = files.filter(f => 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)
  );
  console.log(`    Fichiers totaux: ${files.length}`);
  console.log(`    Images: ${imageFiles.length}`);
  
  if (imageFiles.length > 0) {
    console.log(`    Exemples: ${imageFiles.slice(0, 3).join(', ')}`);
  }
} catch {
  console.log(`    ⚠️  Impossible de lister les fichiers`);
}
console.log();

// Résumé final
console.log('========================================');
console.log('  ✅ Configuration Valide');
console.log('========================================');
console.log();
console.log('RÉSUMÉ:');
console.log(`  • Dossier: ${uploadsDir}`);
console.log(`  • Permissions: Lecture ✓ Écriture ✓ Suppression ✓`);
console.log(`  • Mode: ${nodeEnv === 'development' || useLocalUploads ? 'Développement' : 'Production'}`);
console.log();

if (nodeEnv !== 'development' && !useLocalUploads) {
  console.log('RAPPELS PRODUCTION:');
  console.log('  1. Migrer fichiers existants si nécessaire (migrate-uploads.bat)');
  console.log('  2. Configurer backups pour inclure ce dossier');
  console.log('  3. Vérifier permissions utilisateur service Windows');
  console.log();
}

console.log('Configuration uploads prête pour utilisation ✓');
