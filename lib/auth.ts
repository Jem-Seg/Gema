import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { auth as getAuth } from '@/lib/auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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
            ministere: true
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

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.name}`,
          isAdmin: user.isAdmin,
          isApproved: user.isApproved,
          roleId: user.roleId,
          ministereId: user.ministereId
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
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
        token.lastRefresh = Date.now()
      }

      const shouldRefresh =
        !token.lastRefresh ||
        (Date.now() - (token.lastRefresh as number)) > 5 * 60 * 1000

      if (token.id && shouldRefresh && trigger !== 'signIn') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isAdmin: true,
              isApproved: true,
              roleId: true,
              ministereId: true
            }
          })

          if (dbUser) {
            token.isAdmin = dbUser.isAdmin
            token.isApproved = dbUser.isApproved
            token.roleId = dbUser.roleId
            token.ministereId = dbUser.ministereId
            token.lastRefresh = Date.now()
          }
        } catch (error) {
          console.error('Erreur rafraîchissement token:', error)
        }
      }

      return token
    },

    async session({ session, token }) {
      const t = token as any

      if (session.user) {
        (session.user as any).id = t.id
          (session.user as any).isAdmin = t.isAdmin
            (session.user as any).isApproved = t.isApproved
              (session.user as any).roleId = t.roleId
                (session.user as any).ministereId = t.ministereId
      }
      return session
    },

    // 🚀 REDIRECTION CENTRALE (ADMIN / APPROUVÉ / NON APPROUVÉ)
    async redirect({ baseUrl }) {
      const user = await getAuth()

      if (!user) return `${baseUrl}/sign-in`

      // 🔥 Cas 1 : ADMIN
      if (user.isAdmin) return `${baseUrl}/admin/dashboard`

      // 🔥 Cas 2 : utilisateur NON APPROUVÉ PAR L’ADMIN
      if (!user.isApproved) return `${baseUrl}/pending-approval`

      // 🔥 Cas 3 : utilisateur simple APPROUVÉ
      return `${baseUrl}/dashboard`
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

    // Si déjà admin → OK
    if (user.isAdmin) {
      return true
    }

    // Vérifier avec la clé envoyée depuis la page verify
    if (secretKey && secretKey === process.env.ADMIN_SECRET_KEY) {
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
