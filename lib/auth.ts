import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Configuration de base
  trustHost: true, // Important pour Next.js 15+
  basePath: '/api/auth',
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            role: true,
            ministere: true,
            structure: true
          }
        })

        if (!user || !user.password) {
          throw new Error('Email ou mot de passe incorrect')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect')
        }

        // Retourner les informations utilisateur
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.name}`,
          isAdmin: user.isAdmin,
          isApproved: user.isApproved,
          roleId: user.roleId,
          ministereId: user.ministereId,
          structureId: user.structureId
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-in',
    error: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
        token.isApproved = (user as any).isApproved
        token.roleId = (user as any).roleId
        token.ministereId = (user as any).ministereId
        token.structureId = (user as any).structureId
        token.lastRefresh = Date.now()
      }
      
      // Rafraîchir les données utilisateur seulement toutes les 5 minutes pour éviter surcharge
      const shouldRefresh = !token.lastRefresh || (Date.now() - (token.lastRefresh as number)) > 5 * 60 * 1000
      
      if (token.id && shouldRefresh && trigger !== 'signIn' && trigger !== 'signUp') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isAdmin: true,
              isApproved: true,
              roleId: true,
              ministereId: true,
              structureId: true
            }
          })
          
          if (dbUser) {
            token.isAdmin = dbUser.isAdmin
            token.isApproved = dbUser.isApproved
            token.roleId = dbUser.roleId
            token.ministereId = dbUser.ministereId
            token.structureId = dbUser.structureId
            token.lastRefresh = Date.now()
          }
        } catch (error) {
          console.error('Erreur rafraîchissement token:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).isAdmin = token.isAdmin as boolean
        (session.user as any).isApproved = token.isApproved as boolean
        (session.user as any).roleId = token.roleId as string | null
        (session.user as any).ministereId = token.ministereId as string | null
        (session.user as any).structureId = token.structureId as string | null
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export const GET = handlers.GET
export const POST = handlers.POST

// Fonction pour vérifier le statut admin
export async function checkAdminStatus(userId: string, secretKey?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return false
    }
    
    // Vérifier si l'utilisateur est admin en base
    if (user.isAdmin) {
      return true
    }
    
    // Vérifier avec la clé de sécurité pour le premier admin
    if (secretKey && secretKey === process.env.ADMIN_SECRET_KEY) {
      // Promouvoir l'utilisateur admin
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isAdmin: true,
          isApproved: true 
        }
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error('Erreur lors de la vérification admin:', error)
    return false
  }
}

// Fonction pour obtenir les informations complètes de l'utilisateur
export async function getUserFromDatabase(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        ministere: true,
        structure: true
      }
    })
    
    return user
  } catch (error) {
    console.error('Erreur lors de la récupération utilisateur:', error)
    return null
  }
}
