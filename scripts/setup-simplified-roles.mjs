#!/usr/bin/env node

/**
 * Script pour initialiser les rôles du workflow simplifié
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Initialisation des rôles pour le workflow simplifié...\n');

  try {
    // Supprimer tous les rôles existants
    await prisma.role.deleteMany({});
    console.log('✓ Anciens rôles supprimés\n');

    // Créer les 4 nouveaux rôles
    const roles = [
      {
        name: 'Agent de saisie',
        description: 'Créer et modifier alimentations/octrois, gérer catégories et produits'
      },
      {
        name: 'Responsable Achats',
        description: 'Valider ou mettre en instance les alimentations/octrois, gérer catégories et produits'
      },
      {
        name: 'Responsable Financier',
        description: 'Valider ou mettre en instance après validation achats'
      },
      {
        name: 'Ordonnateur',
        description: 'Validation finale des alimentations et octrois'
      }
    ];

    for (const role of roles) {
      const created = await prisma.role.create({
        data: role
      });
      console.log(`✓ Rôle créé: ${created.name}`);
    }

    console.log('\n✅ Rôles initialisés avec succès!');
    console.log('\n📋 Rôles disponibles:');
    console.log('  1. Agent de saisie');
    console.log('  2. Responsable Achats');
    console.log('  3. Responsable Financier');
    console.log('  4. Ordonnateur\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
