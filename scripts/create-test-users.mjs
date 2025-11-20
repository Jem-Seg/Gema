import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    console.log('🔧 Création des utilisateurs de test...\n')

    // Créer un ministère de test si nécessaire
    let ministere = await prisma.ministere.findFirst({
      where: { abreviation: 'TEST' }
    })

    if (!ministere) {
      ministere = await prisma.ministere.create({
        data: {
          name: 'Ministère de Test',
          abreviation: 'TEST',
          address: 'Rue de Test',
          phone: '1234567890',
          email: 'test@ministere.gov'
        }
      })
      console.log('✅ Ministère de test créé')
    }

    // Créer une structure de test
    let structure = await prisma.structure.findFirst({
      where: { 
        ministereId: ministere.id,
        abreviation: 'STRUCT-TEST'
      }
    })

    if (!structure) {
      structure = await prisma.structure.create({
        data: {
          name: 'Structure de Test',
          abreviation: 'STRUCT-TEST',
          description: 'Structure de test',
          ministereId: ministere.id
        }
      })
      console.log('✅ Structure de test créée')
    }

    // Créer ou récupérer les rôles
    const roles = {
      'Agent de saisie': await prisma.role.upsert({
        where: { name: 'Agent de saisie' },
        update: {},
        create: {
          name: 'Agent de saisie',
          description: 'Agent de saisie des données',
          requiresStructure: true
        }
      }),
      'Responsable Achats': await prisma.role.upsert({
        where: { name: 'Responsable Achats' },
        update: {},
        create: {
          name: 'Responsable Achats',
          description: 'Responsable des achats',
          requiresStructure: false
        }
      }),
      'Directeur Financier': await prisma.role.upsert({
        where: { name: 'Directeur Financier' },
        update: {},
        create: {
          name: 'Directeur Financier',
          description: 'Directeur financier',
          requiresStructure: false
        }
      }),
      'Directeur': await prisma.role.upsert({
        where: { name: 'Directeur' },
        update: {},
        create: {
          name: 'Directeur',
          description: 'Directeur',
          requiresStructure: true
        }
      }),
      'Ordonnateur': await prisma.role.upsert({
        where: { name: 'Ordonnateur' },
        update: {},
        create: {
          name: 'Ordonnateur',
          description: 'Ordonnateur',
          requiresStructure: false
        }
      })
    }

    console.log('✅ Rôles créés/mis à jour\n')

    // Mot de passe par défaut
    const defaultPassword = 'Password123!'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Utilisateurs de test
    const testUsers = [
      {
        email: 'admin@test.com',
        name: 'Admin',
        firstName: 'Super',
        password: hashedPassword,
        isAdmin: true,
        isApproved: true,
        ministereId: ministere.id,
        structureId: null,
        roleId: null
      },
      {
        email: 'agent@test.com',
        name: 'Saisie',
        firstName: 'Agent',
        password: hashedPassword,
        isAdmin: false,
        isApproved: true,
        ministereId: ministere.id,
        structureId: structure.id,
        roleId: roles['Agent de saisie'].id
      },
      {
        email: 'achats@test.com',
        name: 'Achats',
        firstName: 'Responsable',
        password: hashedPassword,
        isAdmin: false,
        isApproved: true,
        ministereId: ministere.id,
        structureId: structure.id,
        roleId: roles['Responsable Achats'].id
      },
      {
        email: 'financier@test.com',
        name: 'Financier',
        firstName: 'Directeur',
        password: hashedPassword,
        isAdmin: false,
        isApproved: true,
        ministereId: ministere.id,
        structureId: structure.id,
        roleId: roles['Directeur Financier'].id
      },
      {
        email: 'directeur@test.com',
        name: 'Direction',
        firstName: 'Directeur',
        password: hashedPassword,
        isAdmin: false,
        isApproved: true,
        ministereId: ministere.id,
        structureId: structure.id,
        roleId: roles['Directeur'].id
      },
      {
        email: 'ordonnateur@test.com',
        name: 'Ordon',
        firstName: 'Ordonnateur',
        password: hashedPassword,
        isAdmin: false,
        isApproved: true,
        ministereId: ministere.id,
        structureId: structure.id,
        roleId: roles['Ordonnateur'].id
      }
    ]

    console.log('👥 Création des utilisateurs de test...\n')

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existing) {
        await prisma.user.update({
          where: { email: userData.email },
          data: userData
        })
        console.log(`✅ ${userData.email} - mis à jour`)
      } else {
        await prisma.user.create({ data: userData })
        console.log(`✅ ${userData.email} - créé`)
      }
    }

    console.log('\n✅ Tous les utilisateurs de test ont été créés !\n')
    console.log('📧 Email / Mot de passe pour tous : Password123!\n')
    console.log('👤 Comptes disponibles :')
    console.log('   - admin@test.com (Admin)')
    console.log('   - agent@test.com (Agent de saisie)')
    console.log('   - achats@test.com (Responsable Achats)')
    console.log('   - financier@test.com (Directeur Financier)')
    console.log('   - directeur@test.com (Directeur)')
    console.log('   - ordonnateur@test.com (Ordonnateur)')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
