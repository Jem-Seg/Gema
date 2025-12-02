import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware pour rediriger les anciennes URLs /uploads vers /api/files
 * Assure la compatibilité avec les images déjà en base de données
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rediriger /uploads/filename vers /api/files/filename
  if (pathname.startsWith('/uploads/')) {
    const filename = pathname.replace('/uploads/', '');
    const newUrl = new URL(`/api/files/${filename}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/uploads/:path*'],
};
