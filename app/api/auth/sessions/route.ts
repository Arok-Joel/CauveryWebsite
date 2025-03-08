import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserSessions, verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// Define the Session type
interface Session {
  id: string;
  userId: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}

export async function GET() {
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

    // Get the user's sessions
    const sessions = await getUserSessions(user.id);

    // Mark the current session
    const sessionsWithCurrent = sessions.map((session: Session) => ({
      ...session,
      isCurrent: session.token === token,
    }));

    // Update the current session's activity
    try {
      await db.session.updateMany({
        where: { token, isRevoked: false },
        data: { lastActive: new Date() },
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
      // Continue even if session activity update fails
    }

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
} 