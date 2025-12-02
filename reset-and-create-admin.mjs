import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Suppression de toutes les données...')
  
  // Supprimer dans l'ordre pour respecter les contraintes
  await prisma.octroi.deleteMany()
  await prisma.alimentation.deleteMany()
  await prisma.produit.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.structure.deleteMany()
  await prisma.ministere.deleteMany()
  await prisma.role.deleteMany()
  
  console.log('✅ Toutes les données supprimées')
  
  console.log('\n🚀 Création des données initiales...')
  
  // Créer un ministère
  const ministere = await prisma.ministere.create({
    data: {
      name: 'Administration Système',
      abreviation: 'ADMIN',
      address: 'Système',
      phone: '000000000',
      email: 'admin@system.local'
    }
  })
  console.log('✅ Ministère créé')

  // Créer une structure
  const structure = await prisma.structure.create({
    data: {
      name: 'Direction Générale',
      abreviation: 'DG',
      ministereId: ministere.id
    }
  })
  console.log('✅ Structure créée')

  // Créer les 4 rôles du workflow simplifié
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'Agent de saisie',
        description: 'Créer et modifier les alimentations et octrois'
      }
    }),
    prisma.role.create({
      data: {
        name: 'Responsable Achats',
        description: 'Valider les achats'
      }
    }),
    prisma.role.create({
      data: {
        name: 'Responsable Financier',
        description: 'Valider financièrement'
      }
    }),
    prisma.role.create({
      data: {
        name: 'Ordonnateur',
        description: 'Validation finale et mise à jour du stock'
      }
    }),
    prisma.role.create({
      data: {
        name: 'Administrateur',
        description: 'Administrateur système - Accès complet'
      }
    })
  ])
  console.log('✅ 5 rôles créés')

  // Créer l'utilisateur admin
  const password = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gestock.local',
      password: password,
      name: 'Administrateur',
      firstName: 'Système',
      isAdmin: true,
      isApproved: true,
      roleId: roles[4].id, // Administrateur
      ministereId: ministere.id
    }
  })

  console.log('\n🎉 Configuration initiale terminée!')
  console.log('\n📊 Résumé:')
  console.log('- 1 Ministère (ADMIN)')
  console.log('- 1 Structure (DG)')
  console.log('- 5 Rôles (Agent, Resp. Achats, Resp. Financier, Ordonnateur, Admin)')
  console.log('- 1 Administrateur')
  console.log('\n🔐 Identifiants:')
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
