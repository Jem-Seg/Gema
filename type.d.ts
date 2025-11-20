import { DefaultSession } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isAdmin: boolean
      isApproved: boolean
      roleId: string | null
      ministereId: string | null
      structureId: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    isAdmin: boolean
    isApproved: boolean
    roleId: string | null
    ministereId: string | null
    structureId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    isAdmin: boolean
    isApproved: boolean
    roleId: string | null
    ministereId: string | null
    structureId: string | null
  }
}
