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

// Vérification et log des variables d'environnement
const secret = process.env.NEXTAUTH_SECRET;
const authUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!secret) {
  console.error('❌ ATTENTION: NEXTAUTH_SECRET non défini !');
  console.error('   NextAuth utilisera un secret par défaut (NON SÉCURISÉ)');
} else {
  console.log('✅ NextAuth configuré avec secret:', secret.substring(0, 10) + '...');
  console.log('✅ NextAuth URL:', authUrl);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  secret: secret || 'fallback-secret-for-development-only',
  
  // Pages personnalisées
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  
  // Debug mode en développement
  debug: process.env.NODE_ENV === 'development',
  
  // Logger pour capturer les erreurs
  logger: {
    error(error: Error) {
      console.error('🔴 NextAuth Error:', error);
    },
    warn(code: string) {
      console.warn('⚠️ NextAuth Warning:', code);
    },
    debug(code: string, metadata?: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 NextAuth Debug:', code, metadata);
      }
    },
  },

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
        try {
          console.log('🔐 Tentative de connexion pour:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Credentials manquantes');
            return null;
          }

          console.log('🔍 Recherche utilisateur dans la base...');
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            console.log('❌ Utilisateur non trouvé:', credentials.email);
            return null;
          }

          if (!user.password) {
            console.log('❌ Pas de mot de passe pour:', credentials.email);
            return null;
          }

          console.log('👤 Utilisateur trouvé:', {
            email: user.email,
            isAdmin: user.isAdmin,
            isApproved: user.isApproved,
            hasPassword: !!user.password
          });

          console.log('🔑 Vérification du mot de passe...');
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            console.log('❌ Mot de passe invalide pour:', credentials.email);
            return null;
          }

          console.log('✅ Authentification réussie pour:', credentials.email);

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
        } catch (error) {
          console.error('💥 Erreur dans authorize:', error);
          console.error('💥 Type erreur:', error instanceof Error ? error.message : String(error));
          // Retourner null au lieu de throw pour éviter de casser NextAuth
          return null;
        }
      },
    }),
  ],

  // --------------------------
  //          JWT
  // --------------------------
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      try {
        // Lors de la connexion, ajouter les données utilisateur
        if (user) {
          console.log('🔑 JWT: Adding user data to token:', user.email);
          token.id = user.id;
          token.email = user.email ?? '';
          token.name = user.name ?? '';
          token.isAdmin = user.isAdmin;
          token.isApproved = user.isApproved;
          token.roleId = user.roleId ?? null;
          token.ministereId = user.ministereId ?? null;
          token.lastRefresh = Date.now();
          console.log('✅ JWT: Token created successfully');
        }

        // Rafraîchir les données de la BD toutes les 5 minutes
        if (token.id && Date.now() - (token.lastRefresh ?? 0) > 5 * 60 * 1000) {
          try {
            console.log('🔄 JWT: Refreshing user data from database');
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
            });

            if (dbUser) {
              token.isAdmin = dbUser.isAdmin;
              token.isApproved = dbUser.isApproved;
              token.roleId = dbUser.roleId;
              token.ministereId = dbUser.ministereId;
              console.log('✅ JWT: User data refreshed');
            } else {
              console.warn('⚠️ JWT: User not found in database:', token.id);
            }

            token.lastRefresh = Date.now();
          } catch (refreshError) {
            console.error('❌ JWT: Error refreshing user data:', refreshError);
            // Continue avec le token existant
          }
        }

        return token;
      } catch (error) {
        console.error('❌ JWT callback error:', error);
        throw error;
      }
    },

    // --------------------------
    //      SESSION CALLBACK
    // --------------------------
    async session({ session, token }) {
      try {
        console.log('📋 Session: Creating session for:', token.email);
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
        console.log('✅ Session: Session created successfully');
        return session;
      } catch (error) {
        console.error('❌ Session callback error:', error);
        throw error;
      }
    },
  },
  
  // --------------------------
  //          EVENTS
  // --------------------------
  events: {
    async signIn({ user, account, profile }) {
      console.log('🎉 Event: User signed in:', user.email);
    },
    async signOut({ token }) {
      console.log('👋 Event: User signed out:', token?.email);
    },
    async session({ session, token }) {
      console.log('📱 Event: Session checked:', session.user.email);
    },
  },
});
