#!/usr/bin/env node

/**
 * Script de migration vers le workflow simplifié
 * 
 * Changements:
 * 1. Suppression du rôle Directeur
 * 2. Suppression du rattachement des utilisateurs aux structures
 * 3. Catégories au niveau ministère (pas structure)
 * 4. Workflow simplifié sans Directeur
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Début de la migration vers le workflow simplifié...\n');

  try {
    // Étape 1: Sauvegarder les données avant migration
    console.log('📊 Analyse des données existantes...');
    
    const users = await prisma.user.findMany({
      include: { role: true, structure: true, ministere: true }
    });
    
    const categories = await prisma.category.findMany({
      include: { ministere: true, structure: true }
    });
    
    console.log(`  - ${users.length} utilisateurs trouvés`);
    console.log(`  - ${categories.length} catégories trouvées\n`);

    // Étape 2: Identifier les rôles à modifier
    console.log('🔍 Analyse des rôles...');
    
    const roles = await prisma.role.findMany();
    const directeurRole = roles.find(r => r.name.toLowerCase().includes('directeur'));
    
    if (directeurRole) {
      const directeurs = await prisma.user.findMany({
        where: { roleId: directeurRole.id },
        include: { role: true }
      });
      
      console.log(`  ⚠️  ${directeurs.length} utilisateurs avec rôle Directeur détectés`);
      console.log(`  → Ces utilisateurs devront être réassignés à un autre rôle\n`);
    }

    // Étape 3: Backup des données critiques
    console.log('💾 Sauvegarde des données...');
    
    const backup = {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        structureId: u.structureId,
        ministereId: u.ministereId,
        roleName: u.role?.name
      })),
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        structureId: c.structureId,
        ministereId: c.ministereId
      }))
    };
    
    // Sauvegarder dans un fichier JSON
    const fs = await import('fs/promises');
    await fs.writeFile(
      './scripts/backup-before-simplification.json',
      JSON.stringify(backup, null, 2)
    );
    
    console.log('  ✓ Backup sauvegardé dans scripts/backup-before-simplification.json\n');

    // Afficher un résumé
    console.log('📋 Résumé de la migration à effectuer:');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  1. Suppression User.structureId');
    console.log('  2. Suppression Category.structureId');
    console.log('  3. Suppression Role.requiresStructure');
    console.log('  4. Mise à jour des statuts alimentations/octrois');
    console.log('  5. Suppression du rôle Directeur');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  ATTENTION: Cette migration est destructive!');
    console.log('   Les données suivantes seront perdues:');
    console.log('   - Rattachement des utilisateurs aux structures');
    console.log('   - Rattachement des catégories aux structures');
    console.log('   - Rôle Directeur\n');

    console.log('✅ Pour appliquer la migration, exécutez:');
    console.log('   npx prisma migrate dev --name simplification_workflow\n');
    
    console.log('📝 Ensuite, mettez à jour manuellement:');
    console.log('   - Les rôles des anciens directeurs');
    console.log('   - Les API routes pour le nouveau workflow');
    console.log('   - Les pages UI pour refléter les changements\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
