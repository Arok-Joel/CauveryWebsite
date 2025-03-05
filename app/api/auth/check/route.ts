import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get auth token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    // Try to find any auth token cookie (including user-specific ones)
    const cookies = cookieHeader.split(';').map(c => c.trim());
    let token = null;
    
    // First try to find a user-specific token
    for (const cookie of cookies) {
      if (cookie.startsWith('auth-token-')) {
        token = cookie.split('=')[1];
        break;
      }
    }
    
    // If no user-specific token found, try the standard auth-token
    if (!token) {
      token = cookies
        .find(c => c.startsWith('auth-token='))
        ?.split('=')[1];
    }

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify token
    const verified = await verifyAuth(token);
    if (!verified) {
      console.log('Token verification failed');
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Add debug logging
    console.log('Auth check successful for user:', verified.email, 'with role:', verified.role);

    // Return user data
    return NextResponse.json({
      user: {
        email: verified.email,
        name: verified.name,
        role: verified.role,
        id: verified.userId || undefined,
        // Include fingerprint for debugging
        fingerprint: verified.fingerprint || undefined,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
