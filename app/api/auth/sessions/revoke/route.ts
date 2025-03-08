import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeSession, revokeAllSessionsExcept, verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const payload = await verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the email in the payload
    const user = await db.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the action and session ID from the request body
    const { action, sessionId } = await req.json();

    if (action === 'revoke_all_except_current') {
      // Revoke all sessions except the current one
      const success = await revokeAllSessionsExcept(user.id, token);
      if (success) {
        return NextResponse.json({ message: 'All other sessions revoked successfully' });
      } else {
        return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
      }
    } else if (action === 'revoke' && sessionId) {
      // Revoke a specific session
      const success = await revokeSession(sessionId);
      if (success) {
        return NextResponse.json({ message: 'Session revoked successfully' });
      } else {
        return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
} 