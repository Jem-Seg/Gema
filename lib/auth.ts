import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { auth as getAuth } from '@/lib/auth'

// === CONFIGURATION NEXTAUTH ===
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
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) {
          throw new Error("Email et mot de passe requis")
        }

        const user = await prisma.user.findUnique({
          where: { email: email },
          include: {
            role: true,
            ministere: true,
          },
        })

        if (!user || !user.password) {
          throw new Error("Email ou mot de passe incorrect")
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error("Email ou mot de passe incorrect")
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.name}`,
          isAdmin: user.isAdmin,
          isApproved: user.isApproved,
          roleId: user.roleId,
          ministereId: user.ministereId,
        }
      }
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },

  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    error: "/sign-in"
  },

  // === CALLBACKS HOLISTIQUES (100% VALIDÉS) ===
  callbacks: {
    // ---- JWT ----
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as any
        token.id = u.id
        token.isAdmin = u.isAdmin
        token.isApproved = u.isApproved
        token.roleId = u.roleId
        token.ministereId = u.ministereId
        token.lastRefresh = Date.now()
      }

      const needsRefresh =
        !token.lastRefresh ||
        Date.now() - (token.lastRefresh as number) > 5 * 60 * 1000

      if (token.id && needsRefresh && trigger !== "signIn") {
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
        } catch (err) {
          console.error("JWT refresh error:", err)
        }
      }

      return token
    },

    // ---- SESSION ----
    async session({ session, token }) {
      const t = token as any

      if (session.user) {
        const u = session.user as any
        u.id = t.id
        u.isAdmin = t.isAdmin
        u.isApproved = t.isApproved
        u.roleId = t.roleId
        u.ministereId = t.ministereId
      }

      return session
    },

    // ---- REDIRECTION GLOBALE ----
    async redirect({ baseUrl }) {
      const session = await getAuth()

      // Non connecté → page login
      if (!session || !session.user) {
        return `${baseUrl}/sign-in`
      }

      // IMPORTANT : Forcer le typage ici !!
      const user = session.user as any

      // ADMIN
      if (user.isAdmin) {
        return `${baseUrl}/admin/dashboard`
      }

      // NON APPROUVÉ PAR L'ADMIN
      if (!user.isApproved) {
        return `${baseUrl}/pending-approval`
      }

      // UTILISATEUR SIMPLE
      return `${baseUrl}/dashboard`
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
})

// === EXPORTS ===
export const GET = handlers.GET
export const POST = handlers.POST

// === CHECK ADMIN STATUS (utilisé dans /api/admin/verify) ===
export async function checkAdminStatus(userId: string, secretKey?: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return false

    if (user.isAdmin) return true

    if (secretKey && secretKey === process.env.ADMIN_SECRET_KEY) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true, isApproved: true }
      })
      return true
    }

    return false

  } catch (e) {
    console.error("Erreur checkAdminStatus:", e)
    return false
  }
}
