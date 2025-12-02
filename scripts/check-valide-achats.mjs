import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkValideAchats() {
  try {
    console.log('🔍 Recherche d\'alimentations avec statut VALIDE_ACHATS...\n');

    // Chercher les alimentations avec VALIDE_ACHATS
    const alimentations = await prisma.alimentation.findMany({
      where: {
        statut: 'VALIDE_ACHATS'
      },
      select: {
        id: true,
        numero: true,
        statut: true,
        createdAt: true
      }
    });

    if (alimentations.length === 0) {
      console.log('✅ Aucune alimentation avec statut VALIDE_ACHATS trouvée');
      console.log('   Le workflow est conforme : Resp. Achats valide → EN_INSTANCE_FINANCIER\n');
    } else {
      console.log(`⚠️  Trouvé ${alimentations.length} alimentation(s) avec statut VALIDE_ACHATS :\n`);
      
      alimentations.forEach((a) => {
        console.log(`  - Alimentation #${a.numero}`);
        console.log(`    ID: ${a.id}`);
        console.log(`    Créé le: ${a.createdAt.toLocaleDateString('fr-FR')}\n`);
      });

      console.log('💡 Ces alimentations devraient avoir le statut EN_INSTANCE_FINANCIER');
      console.log('   (Validées par Resp. Achats, en attente validation Resp. Financier)\n');
    }

    // Afficher la répartition complète
    console.log('📊 Répartition complète par statut :');
    const countByStatus = await prisma.alimentation.groupBy({
      by: ['statut'],
      _count: true
    });

    countByStatus.forEach(({ statut, _count }) => {
      console.log(`  - ${statut}: ${_count}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkValideAchats()
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
