import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migration des anciens statuts vers le nouveau format...\n');

  // Mapping des anciens statuts vers les nouveaux
  const statusMapping = {
    'en attente': 'EN_ATTENTE',
    'en instance achats': 'EN_INSTANCE_ACHATS',
    'correction achats': 'EN_INSTANCE_ACHATS',
    'validé achats': 'VALIDE_ACHATS',
    'valide achats': 'VALIDE_ACHATS',
    'en instance financier': 'EN_INSTANCE_FINANCIER',
    'correction financier': 'EN_INSTANCE_FINANCIER',
    'validé financier': 'VALIDE_FINANCIER',
    'valide financier': 'VALIDE_FINANCIER',
    'validé ordonnateur': 'VALIDE_ORDONNATEUR',
    'valide ordonnateur': 'VALIDE_ORDONNATEUR',
    'rejeté': 'REJETE',
    'rejete': 'REJETE'
  };

  // Récupérer toutes les alimentations
  const alimentations = await prisma.alimentation.findMany({
    select: { id: true, statut: true }
  });

  console.log(`📊 ${alimentations.length} alimentations trouvées\n`);

  let updatedCount = 0;

  for (const alimentation of alimentations) {
    const normalizedStatus = alimentation.statut.toLowerCase();
    const newStatus = statusMapping[normalizedStatus];

    if (newStatus && newStatus !== alimentation.statut) {
      await prisma.alimentation.update({
        where: { id: alimentation.id },
        data: { statut: newStatus }
      });
      console.log(`✅ ${alimentation.id}: "${alimentation.statut}" → "${newStatus}"`);
      updatedCount++;
    }
  }

  console.log(`\n✨ Migration terminée: ${updatedCount} alimentation(s) mise(s) à jour`);

  // Récupérer aussi les octrois si besoin
  const octrois = await prisma.octroi.findMany({
    select: { id: true, statut: true }
  });

  console.log(`\n📊 ${octrois.length} octrois trouvés\n`);

  let octroiUpdatedCount = 0;

  for (const octroi of octrois) {
    const normalizedStatus = octroi.statut.toLowerCase();
    const newStatus = statusMapping[normalizedStatus];

    if (newStatus && newStatus !== octroi.statut) {
      await prisma.octroi.update({
        where: { id: octroi.id },
        data: { statut: newStatus }
      });
      console.log(`✅ ${octroi.id}: "${octroi.statut}" → "${newStatus}"`);
      octroiUpdatedCount++;
    }
  }

  console.log(`\n✨ Migration terminée: ${octroiUpdatedCount} octroi(s) mis à jour`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
