import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { auth as getAuth } from '@/lib/auth'  // Important pour callback redirect

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
          include: { role: true, ministere: true }
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

      const shouldRefresh = !token.lastRefresh ||
        (Date.now() - (token.lastRefresh as number)) > 5 * 60 * 1000

      if (token.id && shouldRefresh && trigger !== 'signIn' && trigger !== 'signUp') {
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
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).isAdmin = token.isAdmin as boolean
        (session.user as any).isApproved = token.isApproved as boolean
        (session.user as any).roleId = token.roleId as string | null
        (session.user as any).ministereId = token.ministereId as string | null
      }
      return session
    },

    // 🔥 REDIRECTION INTELLIGENTE (Admin / Utilisateur simple)
    async redirect({ url, baseUrl }) {
      const user = await getAuth()

      // Si pas connecté → connexion
      if (!user) return `${baseUrl}/sign-in`

      // Si l'utilisateur existe mais n'est pas approuvé
      if (!user.isApproved) return `${baseUrl}/sign-in?error=not-approved`

      // Administrateur
      if (user.isAdmin) return `${baseUrl}/admin/dashboard`

      // Utilisateur normal
      return `${baseUrl}/dashboard`
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
})

export const GET = handlers.GET
export const POST = handlers.POST
