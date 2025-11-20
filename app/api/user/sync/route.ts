import { NextResponse } from 'next/server'

// Cette route n'est plus nécessaire avec NextAuth
// Les données utilisateur sont maintenant gérées via /api/user/[id]
export const GET = () => NextResponse.json({ message: 'Route deprecated' }, { status: 410 })
export const POST = () => NextResponse.json({ message: 'Route deprecated' }, { status: 410 })