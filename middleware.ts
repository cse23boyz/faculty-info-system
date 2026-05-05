// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const adminAuth = request.cookies.get('adminAuth');
    if (!adminAuth || adminAuth.value !== 'true') {
      const loginUrl = new URL('/login/admin', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect faculty routes
  if (pathname.startsWith('/faculty')) {
    const facultyAuth = request.cookies.get('facultyAuth');
    if (!facultyAuth || facultyAuth.value !== 'true') {
      const loginUrl = new URL('/login/faculty', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/faculty/:path*'],
};