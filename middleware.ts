import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/admin/login', request.url));
    }

    try {
      const verifiedToken = await verifyAuth(token);
      if (!verifiedToken || verifiedToken.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/admin/login', request.url));
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/auth/admin/login', request.url));
    }
  }

  return NextResponse.next();
}
