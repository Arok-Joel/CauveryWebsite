import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

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
