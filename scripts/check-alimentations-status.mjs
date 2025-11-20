import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Vérification des statuts des alimentations...\n');

    const alimentations = await prisma.alimentation.findMany({
      select: {
        id: true,
        numero: true,
        statut: true,
        createdAt: true,
        produit: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (alimentations.length === 0) {
      console.log('❌ Aucune alimentation trouvée dans la base de données');
      return;
    }

    console.log(`📊 Total: ${alimentations.length} alimentation(s)\n`);

    // Grouper par statut
    const parStatut = {};
    alimentations.forEach(a => {
      if (!parStatut[a.statut]) {
        parStatut[a.statut] = [];
      }
      parStatut[a.statut].push(a);
    });

    // Afficher les résultats
    Object.keys(parStatut).forEach(statut => {
      console.log(`\n📌 Statut: ${statut} (${parStatut[statut].length})`);
      parStatut[statut].forEach(a => {
        console.log(`   - ${a.numero}: ${a.produit.name}`);
      });
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
