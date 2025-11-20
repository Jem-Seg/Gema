import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Migration des alimentations de SAISIE vers INSTANCE_FINANCIER...');

    // Trouver toutes les alimentations en statut SAISIE
    const alimentations = await prisma.alimentation.findMany({
      where: {
        statut: 'SAISIE'
      }
    });

    console.log(`📊 Trouvé ${alimentations.length} alimentation(s) en statut SAISIE`);

    if (alimentations.length === 0) {
      console.log('✅ Aucune alimentation à migrer');
      return;
    }

    // Mettre à jour chaque alimentation
    for (const alimentation of alimentations) {
      // Mettre à jour le statut
      await prisma.alimentation.update({
        where: { id: alimentation.id },
        data: {
          statut: 'INSTANCE_FINANCIER'
        }
      });

      // Mettre à jour l'historique
      await prisma.actionHistorique.updateMany({
        where: {
          entityType: 'ALIMENTATION',
          entityId: alimentation.id,
          nouveauStatut: 'SAISIE'
        },
        data: {
          nouveauStatut: 'INSTANCE_FINANCIER'
        }
      });

      console.log(`✅ Migré: ${alimentation.numero} (SAISIE → INSTANCE_FINANCIER)`);
    }

    console.log(`\n🎉 Migration terminée avec succès ! ${alimentations.length} alimentation(s) migrée(s)`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
