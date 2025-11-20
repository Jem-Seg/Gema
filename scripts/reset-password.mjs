import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
  const email = 'jem.mhamed@gmail.com'
  const newPassword = 'Password123!' // Mot de passe temporaire
  
  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Utilisateur avec l'email ${email} introuvable`)
      process.exit(1)
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    console.log('✅ Mot de passe réinitialisé avec succès !')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Nouveau mot de passe temporaire: ${newPassword}`)
    console.log('\n⚠️  Veuillez changer ce mot de passe après la première connexion')

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()
