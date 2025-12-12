// ==========================
// lib/auth.ts (VERSION STABLE)
// ==========================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// Compatibilité TypeScript : étendre les types Session et JWT
declare module "next-auth" {
  interface User {
    id: string;
    isAdmin: boolean;
    isApproved: boolean;
    roleId: string | null;
    ministereId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      isApproved: boolean;
      roleId: string | null;
      ministereId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    isApproved: boolean;
    roleId: string | null;
    ministereId: string | null;
    lastRefresh: number;
  }
}

// ==========================
//    CONFIGURATION NEXTAUTH
// ==========================

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  secret: process.env.NEXTAUTH_SECRET,

  // --------------------------
  //        PROVIDER
  // --------------------------
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error("Email ou mot de passe incorrect");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Renvoi des valeurs attendues par JWT + Session
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.name}`,
          isAdmin: user.isAdmin,
          isApproved: user.isApproved,
          roleId: user.roleId,
          ministereId: user.ministereId,
        };
      },
    }),
  ],

  // --------------------------
  //          JWT
  // --------------------------
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // Lors de la connexion, ajouter les données utilisateur
      if (user) {
        token.id = user.id;
        token.email = user.email ?? '';
        token.name = user.name ?? '';
        token.isAdmin = user.isAdmin;
        token.isApproved = user.isApproved;
        token.roleId = user.roleId ?? null;
        token.ministereId = user.ministereId ?? null;
        token.lastRefresh = Date.now();
      }

      // Rafraîchir les données de la BD toutes les 5 minutes
      if (Date.now() - (token.lastRefresh ?? 0) > 5 * 60 * 1000) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
        });

        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.isApproved = dbUser.isApproved;
          token.roleId = dbUser.roleId;
          token.ministereId = dbUser.ministereId;
        }

        token.lastRefresh = Date.now();
      }

      return token;
    },

    // --------------------------
    //      SESSION CALLBACK
    // --------------------------
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        emailVerified: null,
        name: token.name as string,
        isAdmin: token.isAdmin as boolean,
        isApproved: token.isApproved as boolean,
        roleId: token.roleId as string | null,
        ministereId: token.ministereId as string | null,
      };

      return session;
    },
  },
});
