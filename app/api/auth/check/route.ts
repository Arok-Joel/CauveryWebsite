import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get auth token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find((c: string) => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify token
    const verified = await verifyAuth(token);
    if (!verified) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Return user data
    return NextResponse.json({
      user: {
        email: verified.email,
        name: verified.name,
        role: verified.role,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
