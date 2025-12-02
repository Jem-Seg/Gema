import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reverseMigration() {
  try {
    console.log('🔄 Réversion de migration : EN_INSTANCE_ACHATS → EN_INSTANCE_FINANCIER');
    console.log('----------------------------------------');

    // IDs des 4 alimentations qui ont été incorrectement migrées
    const affectedIds = [
      'f1528ac7-6115-4b87-b824-97b6a04f3b19',
      '74840187-9701-45c6-ba10-44f7b192fd26',
      'b4c4d0e9-3397-4fa7-ae2d-ea4fc2417ba5',
      '03099898-c618-4833-ad15-0270f6f2fa4e'
    ];

    // Vérifier les statuts actuels
    console.log('📋 Vérification des statuts actuels...\n');
    for (const id of affectedIds) {
      const alimentation = await prisma.alimentation.findUnique({
        where: { id },
        select: { 
          id: true, 
          statut: true,
          numero: true,
          createdAt: true 
        }
      });

      if (alimentation) {
        console.log(`  - Alimentation #${alimentation.numero}`);
        console.log(`    ID: ${id}`);
        console.log(`    Statut actuel: ${alimentation.statut}`);
        console.log(`    Créé le: ${alimentation.createdAt.toLocaleDateString('fr-FR')}\n`);
      } else {
        console.log(`  ⚠️  ID ${id} non trouvé\n`);
      }
    }

    // Demander confirmation
    console.log('----------------------------------------');
    console.log('Ces alimentations vont être changées de EN_INSTANCE_ACHATS à EN_INSTANCE_FINANCIER');
    console.log('Signification: Validées par Resp. Achats → En attente validation Resp. Financier');
    console.log('----------------------------------------\n');

    // Mise à jour
    const result = await prisma.alimentation.updateMany({
      where: {
        id: { in: affectedIds },
        statut: 'EN_INSTANCE_ACHATS'
      },
      data: {
        statut: 'EN_INSTANCE_FINANCIER'
      }
    });

    console.log(`✅ Réversion terminée : ${result.count} alimentation(s) mise(s) à jour`);
    
    if (result.count > 0) {
      console.log('\n📝 Nouvelles règles de visibilité :');
      console.log('   - Ces alimentations sont maintenant visibles par le Responsable Financier');
      console.log('   - Le Responsable Achats ne les voit plus (sauf retour en instance)');
      console.log('   - Workflow: Resp. Achats valide → EN_INSTANCE_FINANCIER → Resp. Financier valide');
    }

    // Vérification finale
    console.log('\n📊 Vérification post-migration :');
    const countByStatus = await prisma.alimentation.groupBy({
      by: ['statut'],
      _count: true
    });

    console.log('\nRépartition des alimentations par statut :');
    countByStatus.forEach(({ statut, _count }) => {
      console.log(`  - ${statut}: ${_count}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la réversion :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

reverseMigration()
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
