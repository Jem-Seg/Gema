// Script pour créer les rôles de base du système
// Utilisation: node setup-roles.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultRoles = [
  {
    name: 'GESTIONNAIRE',
    description: 'Agent de saisie - Peut créer et mettre en instance les alimentations et octrois',
    requiresStructure: true
  },
  {
    name: 'FINANCIER',
    description: 'Responsable Financier - Peut valider les instances financier',
    requiresStructure: false
  },
  {
    name: 'DIRECTEUR',
    description: 'Directeur - Peut valider les instances directeur',
    requiresStructure: true
  },
  {
    name: 'ORDONNATEUR',
    description: 'Ordonnateur - Peut effectuer la validation finale avec mise à jour des stocks',
    requiresStructure: false
  }
];

async function setupRoles() {
  try {
    console.log('🔧 Configuration des rôles du système...');
    
    for (const roleData of defaultRoles) {
      // Vérifier si le rôle existe déjà
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      });

      if (existingRole) {
        console.log(`   ✅ Rôle "${roleData.name}" existe déjà`);
        continue;
      }

      // Créer le rôle
      const newRole = await prisma.role.create({
        data: roleData
      });

      console.log(`   ✨ Rôle "${newRole.name}" créé avec succès`);
    }

    console.log('');
    console.log('🎉 Configuration des rôles terminée !');
    console.log('');
    console.log('📋 Rôles disponibles pour le workflow :');
    
    const allRoles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });

    allRoles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
      console.log(`     Structure requise: ${role.requiresStructure ? '✅' : '❌'}`);
      console.log('');
    });

    console.log('💡 Les administrateurs peuvent maintenant assigner ces rôles aux utilisateurs.');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration des rôles :', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupRoles();