import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Mise à jour des prix null...');
  
  const result = await prisma.produit.updateMany({
    where: {
      price: null
    },
    data: {
      price: 0
    }
  });
  
  console.log(`${result.count} produits mis à jour avec prix = 0`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
