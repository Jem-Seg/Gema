// Script pour créer un compte administrateur de test
// Utilisation: node create-admin.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    console.log('🔍 Vérification des comptes administrateurs existants...');
    
    // Vérifier s'il existe déjà un admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        isAdmin: true
      }
    });

    if (existingAdmin) {
      console.log('✅ Un compte administrateur existe déjà :');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nom: ${existingAdmin.firstName} ${existingAdmin.name}`);
      console.log(`   ID: ${existingAdmin.id}`);
      return;
    }

    console.log('⚠️  Aucun compte administrateur trouvé.');
    console.log('🔧 Pour créer un compte admin, vous devez :');
    console.log('');
    console.log('1. Vous connecter à l\'application avec Clerk');
    console.log('2. Une fois connecté, utiliser le script suivant pour promouvoir votre compte :');
    console.log('');
    console.log('--- Script de promotion ---');
    console.log('```javascript');
    console.log('// Remplacez YOUR_EMAIL par votre email Clerk');
    console.log('const user = await prisma.user.update({');
    console.log('  where: { email: "YOUR_EMAIL" },');
    console.log('  data: { ');
    console.log('    isAdmin: true,');
    console.log('    isApproved: true');
    console.log('  }');
    console.log('});');
    console.log('```');
    console.log('');

    // Lister tous les utilisateurs existants
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        isAdmin: true,
        isApproved: true,
        clerkId: true
      }
    });

    if (allUsers.length > 0) {
      console.log('👥 Utilisateurs existants :');
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.name})`);
        console.log(`     Admin: ${user.isAdmin ? '✅' : '❌'} | Approuvé: ${user.isApproved ? '✅' : '❌'}`);
        console.log(`     ID: ${user.id}`);
        console.log('');
      });

      console.log('💡 Pour promouvoir un utilisateur existant en admin :');
      console.log('');
      console.log('```javascript');
      console.log('const user = await prisma.user.update({');
      console.log('  where: { id: "COPY_USER_ID_HERE" },');
      console.log('  data: { ');
      console.log('    isAdmin: true,');
      console.log('    isApproved: true');
      console.log('  }');
      console.log('});');
      console.log('```');
    } else {
      console.log('👥 Aucun utilisateur trouvé dans la base de données.');
      console.log('');
      console.log('🚀 Étapes pour créer votre premier compte admin :');
      console.log('1. Lancez l\'application: npm run dev');
      console.log('2. Allez sur http://localhost:3000');
      console.log('3. Connectez-vous avec Clerk');
      console.log('4. Revenez exécuter ce script');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount();