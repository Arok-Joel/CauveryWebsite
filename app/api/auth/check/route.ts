import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Add request ID for tracing
    const requestId = crypto.randomUUID().slice(0, 8);
    console.log(`[${requestId}] Auth check request received`);
    
    // Get auth token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      console.log(`[${requestId}] No cookies found in request`);
      return NextResponse.json({ user: null }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // Log all cookies for debugging (without sensitive values)
    console.log(`[${requestId}] Cookies found:`, cookieHeader.split(';').map(c => c.trim().split('=')[0]));
    
    // Try to find any auth token cookie (including user-specific ones)
    const cookies = cookieHeader.split(';').map(c => c.trim());
    let token = null;
    let tokenSource = '';
    
    // First try to find a user-specific token
    for (const cookie of cookies) {
      if (cookie.startsWith('auth-token-')) {
        token = cookie.split('=')[1];
        tokenSource = cookie.split('=')[0];
        console.log(`[${requestId}] Found user-specific token: ${tokenSource}`);
        break;
      }
    }
    
    // If no user-specific token found, try the standard auth-token
    if (!token) {
      const authCookie = cookies.find(c => c.startsWith('auth-token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
        tokenSource = 'auth-token';
        console.log(`[${requestId}] Found standard auth token`);
      }
    }

    if (!token) {
      console.log(`[${requestId}] No auth token found in cookies`);
      return NextResponse.json({ user: null }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Verify token
    const verified = await verifyAuth(token);
    if (!verified) {
      console.log(`[${requestId}] Token verification failed for token from ${tokenSource}`);
      return NextResponse.json({ user: null }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Add debug logging
    console.log(`[${requestId}] Auth check successful for user: ${verified.email}, with role: ${verified.role}, from token: ${tokenSource}`);
    console.log(`[${requestId}] Token payload:`, {
      email: verified.email,
      name: verified.name,
      role: verified.role,
      userId: verified.userId,
      sessionId: verified.sessionId,
      fingerprint: verified.fingerprint,
      issuedAt: verified.issuedAt ? new Date(verified.issuedAt).toISOString() : undefined,
      exp: verified.exp ? new Date(verified.exp * 1000).toISOString() : undefined,
    });

    // Return user data with no-cache headers
    const response = NextResponse.json({
      user: {
        email: verified.email,
        name: verified.name,
        role: verified.role,
        id: verified.userId || undefined,
        fingerprint: verified.fingerprint || undefined,
      },
    });
    
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Auth check error:', error);
    const response = NextResponse.json({ user: null }, { status: 200 });
    
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}
