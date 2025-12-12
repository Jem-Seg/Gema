import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PRIORITÉ 1 : Rediriger /uploads vers /api/files pour compatibilité
  if (pathname.startsWith('/uploads/')) {
    const filename = pathname.replace('/uploads/', '');
    const newUrl = new URL(`/api/files/${filename}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // PRIORITÉ 2 : Authentification NextAuth
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') || 
                     request.nextUrl.pathname.startsWith('/sign-up') ||
                     request.nextUrl.pathname.startsWith('/reset-password')
  
  const isPostSignIn = request.nextUrl.pathname === '/post-sign-in'
  const isAdminVerify = request.nextUrl.pathname === '/admin/verify'

  const isPublicPage = isAuthPage || request.nextUrl.pathname === '/' || isPostSignIn || isAdminVerify

  // Routes protégées qui nécessitent l'approbation et un rôle
  const protectedRoutes = [
    '/dashboard',
    '/category',
    '/products',
    '/alimentations',
    '/octrois',
    '/transactions',
    '/new-product',
    '/update-product',
    '/give'
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Rediriger vers sign-in si pas de token et pas sur une page publique
  if (!token && !isPublicPage) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Rediriger vers post-sign-in si connecté et sur une page d'auth
  // Cela permet de gérer la logique de redirection après connexion
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/post-sign-in', request.url))
  }

  // Vérifier l'approbation et le rôle pour les routes protégées
  if (token && isProtectedRoute) {
    const isApproved = token.isApproved as boolean
    const hasRole = !!(token.roleId || token.role)
    const isAdmin = token.isAdmin as boolean

    // Les admins ont toujours accès, sinon vérifier approbation + rôle
    if (!isAdmin && (!isApproved || !hasRole)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|api/files|_next/static|_next/image|favicon.ico).*)',
  ],
}
