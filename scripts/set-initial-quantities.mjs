import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setInitialQuantities() {
  try {
    console.log('📊 Mise à jour des quantités initiales des produits...');

    // Récupérer tous les produits
    const produits = await prisma.produit.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        initialQuantity: true
      }
    });

    console.log(`\n✅ ${produits.length} produits trouvés\n`);

    let updated = 0;
    let skipped = 0;

    for (const produit of produits) {
      // Si initialQuantity est 0, mettre à jour avec la quantité actuelle
      if (produit.initialQuantity === 0) {
        await prisma.produit.update({
          where: { id: produit.id },
          data: { initialQuantity: produit.quantity }
        });
        console.log(`✓ ${produit.name}: initialQuantity défini à ${produit.quantity}`);
        updated++;
      } else {
        console.log(`⊘ ${produit.name}: initialQuantity déjà défini (${produit.initialQuantity})`);
        skipped++;
      }
    }

    console.log(`\n📈 Résumé:`);
    console.log(`   - Produits mis à jour: ${updated}`);
    console.log(`   - Produits ignorés: ${skipped}`);
    console.log(`\n✅ Terminé!`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setInitialQuantities();
