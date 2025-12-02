import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migration : EN_INSTANCE_FINANCIER → EN_INSTANCE_ACHATS\n');

  // Trouver toutes les alimentations avec EN_INSTANCE_FINANCIER
  const alimentations = await prisma.alimentation.findMany({
    where: { statut: 'EN_INSTANCE_FINANCIER' },
    select: { id: true, statut: true }
  });

  console.log(`📊 ${alimentations.length} alimentation(s) avec statut EN_INSTANCE_FINANCIER trouvée(s)\n`);

  if (alimentations.length === 0) {
    console.log('✅ Aucune migration nécessaire');
    return;
  }

  let updatedCount = 0;

  for (const alimentation of alimentations) {
    await prisma.alimentation.update({
      where: { id: alimentation.id },
      data: { statut: 'EN_INSTANCE_ACHATS' }
    });
    console.log(`✅ ${alimentation.id}: EN_INSTANCE_FINANCIER → EN_INSTANCE_ACHATS`);
    updatedCount++;
  }

  console.log(`\n✨ Migration terminée: ${updatedCount} alimentation(s) mise(s) à jour`);
  console.log('\n📝 Note: Ces alimentations sont maintenant visibles par le Responsable Achats pour modifications');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
