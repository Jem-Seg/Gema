import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Création du premier administrateur...')
  
  // Créer un ministère par défaut
  const ministere = await prisma.ministere.upsert({
    where: { abreviation: 'ADMIN' },
    update: {},
    create: {
      name: 'Administration Système',
      abreviation: 'ADMIN',
      address: 'Système',
      phone: '000000000',
      email: 'admin@system.local'
    }
  })
  console.log('✅ Ministère ADMIN créé')

  // Créer une structure par défaut
  const structure = await prisma.structure.create({
    data: {
      name: 'Direction Générale',
      abreviation: 'DG',
      ministereId: ministere.id
    }
  })
  console.log('✅ Structure DG créée')

  // Créer le rôle Administrateur
  const role = await prisma.role.upsert({
    where: { name: 'Administrateur' },
    update: {},
    create: {
      name: 'Administrateur',
      description: 'Administrateur système - Accès complet'
    }
  })
  console.log('✅ Rôle Administrateur créé')

  // Hasher le mot de passe
  const password = await bcrypt.hash('admin123', 10)

  // Créer l'utilisateur admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gestock.local',
      password: password,
      name: 'Administrateur',
      firstName: 'Système',
      isAdmin: true,
      isApproved: true,
      roleId: role.id,
      ministereId: ministere.id
    }
  })

  console.log('\n🎉 Premier administrateur créé avec succès!')
  console.log('📧 Email:', admin.email)
  console.log('🔑 Mot de passe: admin123')
  console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
