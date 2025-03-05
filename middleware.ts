import { NextRequest } from "next/server";

// This is a temporary solution until we fully implement Clerk
// We'll keep the existing middleware functionality for now
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Add a unique request ID for tracing
  const requestId = crypto.randomUUID().slice(0, 8);
  
  // Log the request path for debugging
  console.log(`[${requestId}] Middleware processing request for: ${request.nextUrl.pathname}`);
  
  const token = request.cookies.get('auth-token')?.value;
  
  // Check for user-specific tokens if standard token not found
  let userToken = token;
  if (!userToken) {
    // Try to find a user-specific token
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('auth-token-')) {
        userToken = cookie.value;
        console.log(`[${requestId}] Found user-specific token in middleware: ${cookie.name}`);
        break;
      }
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!userToken) {
      console.log(`[${requestId}] No auth token found for admin route, redirecting to login`);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const verifiedToken = await verifyAuth(userToken);
      if (!verifiedToken || verifiedToken.role !== 'ADMIN') {
        console.log(`[${requestId}] Invalid token for admin route, redirecting to login`);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      
      console.log(`[${requestId}] Admin access granted for: ${verifiedToken.email}`);
    } catch (error) {
      console.error(`[${requestId}] Error verifying admin token:`, error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Add no-cache headers to all responses
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Add a matcher to exclude static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
