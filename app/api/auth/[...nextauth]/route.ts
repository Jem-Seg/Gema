import { GET as AuthGET, POST as AuthPOST } from '@/lib/auth'

export const GET = AuthGET
export const POST = AuthPOST

// Configuration runtime pour éviter les erreurs de cache
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

