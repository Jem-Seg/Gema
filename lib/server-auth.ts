import { auth } from './auth'
import prisma from './prisma'

export async function getCurrentUser() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      role: true,
      ministere: true,
      structure: true
    }
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Non authentifié')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  
  if (!user.isAdmin) {
    throw new Error('Accès non autorisé')
  }
  
  return user
}
