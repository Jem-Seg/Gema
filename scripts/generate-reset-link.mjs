import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function generateResetLink(email) {
  try {
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      console.error('❌ Utilisateur non trouvé:', email)
      process.exit(1)
    }

    console.log('✅ Utilisateur trouvé:', user.name, user.firstName)

    // Supprimer les anciens tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    })

    // Générer un nouveau token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 heure

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires
      }
    })

    const resetLink = `http://localhost:3000/reset-password?token=${token}`

    console.log('\n🔗 Lien de réinitialisation généré :')
    console.log(resetLink)
    console.log('\n⏰ Expire le:', expires.toLocaleString('fr-FR'))
    console.log('\n💡 Utilisez ce lien pour réinitialiser le mot de passe.')
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2]

if (!email) {
  console.log('Usage: node generate-reset-link.mjs <email>')
  console.log('Exemple: node generate-reset-link.mjs jem.mhamed@gmail.com')
  process.exit(1)
}

generateResetLink(email)
