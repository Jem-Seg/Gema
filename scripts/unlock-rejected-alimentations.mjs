import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockRejectedAlimentations() {
  try {
    console.log('🔓 Déverrouillage des alimentations rejetées...');

    const result = await prisma.alimentation.updateMany({
      where: {
        statut: 'REJETE',
        isLocked: true
      },
      data: {
        isLocked: false
      }
    });

    console.log(`✅ ${result.count} alimentation(s) rejetée(s) déverrouillée(s)`);

    // Afficher les alimentations rejetées
    const rejectedAlimentations = await prisma.alimentation.findMany({
      where: {
        statut: 'REJETE'
      },
      select: {
        id: true,
        numero: true,
        statut: true,
        isLocked: true,
        produit: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('\n📋 Alimentations rejetées:');
    rejectedAlimentations.forEach(alim => {
      console.log(`  - ${alim.numero}: ${alim.produit.name} (Verrouillé: ${alim.isLocked})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unlockRejectedAlimentations();
