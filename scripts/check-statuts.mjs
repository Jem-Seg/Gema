import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des statuts...\n');

  const alimentations = await prisma.alimentation.findMany({
    select: { 
      id: true, 
      statut: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`📊 Dernières alimentations:\n`);
  
  alimentations.forEach((a, index) => {
    console.log(`${index + 1}. ID: ${a.id}`);
    console.log(`   Statut: "${a.statut}"`);
    console.log(`   Créé le: ${a.createdAt}`);
    console.log('');
  });

  // Chercher l'alimentation problématique
  const problematic = await prisma.alimentation.findUnique({
    where: { id: '03099898-c618-4833-ad15-0270f6f2fa4e' },
    select: { id: true, statut: true, createurId: true }
  });

  if (problematic) {
    console.log('🔴 Alimentation problématique trouvée:');
    console.log(`   ID: ${problematic.id}`);
    console.log(`   Statut actuel: "${problematic.statut}"`);
    console.log(`   Créateur: ${problematic.createurId}`);
  } else {
    console.log('❌ Alimentation 03099898-c618-4833-ad15-0270f6f2fa4e non trouvée');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
