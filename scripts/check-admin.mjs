// Script pour vérifier et créer un compte administrateur
// Utilisation: node scripts/check-admin.mjs

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Vérification des comptes administrateurs...\n');
    
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
      console.log(`   isAdmin: ${existingAdmin.isAdmin}`);
      console.log(`   isApproved: ${existingAdmin.isApproved}`);
      console.log(`   ID: ${existingAdmin.id}\n`);
      
      // Vérifier si le mot de passe existe
      if (!existingAdmin.password) {
        console.log('⚠️  ATTENTION: Cet admin n\'a pas de mot de passe!');
        console.log('   Il ne pourra pas se connecter.\n');
      } else {
        console.log('✅ Mot de passe configuré\n');
      }
      
      return;
    }

    console.log('⚠️  Aucun compte administrateur trouvé.\n');
    
    // Lister tous les utilisateurs
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        isAdmin: true,
        isApproved: true,
        password: true
      }
    });

    if (allUsers.length === 0) {
      console.log('📝 Création d\'un compte administrateur de test...\n');
      
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const admin = await prisma.user.create({
        data: {
          email: 'admin@gestock.mr',
          password: hashedPassword,
          firstName: 'Admin',
          name: 'Système',
          isAdmin: true,
          isApproved: true
        }
      });

      console.log('✅ Compte administrateur créé avec succès!');
      console.log('\n📋 Informations de connexion:');
      console.log('   Email: admin@gestock.mr');
      console.log('   Mot de passe: Admin123!');
      console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!\n');
      
    } else {
      console.log('👥 Utilisateurs existants :');
      allUsers.forEach(user => {
        console.log(`\n   📧 ${user.email}`);
        console.log(`   👤 ${user.firstName} ${user.name}`);
        console.log(`   🔑 Admin: ${user.isAdmin ? '✅' : '❌'} | Approuvé: ${user.isApproved ? '✅' : '❌'}`);
        console.log(`   🔒 Password: ${user.password ? '✅ Configuré' : '❌ Manquant'}`);
        console.log(`   🆔 ID: ${user.id}`);
      });

      console.log('\n💡 Pour promouvoir un utilisateur en admin, utilisez:');
      console.log('\nconst user = await prisma.user.update({');
      console.log('  where: { email: "EMAIL_ICI" },');
      console.log('  data: { isAdmin: true, isApproved: true }');
      console.log('});\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();
