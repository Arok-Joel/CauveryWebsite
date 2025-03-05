import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth, logout, logoutAllSessions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Verify the token to get the user
    const verified = await verifyAuth(token);
    if (!verified || !verified.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: verified.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Invalidate all sessions for this user
    await logoutAllSessions(user.id);
    
    // Also logout the current session
    const response = await logout(token);
    return response;
  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json({ error: 'Failed to logout from all devices' }, { status: 500 });
  }
} 