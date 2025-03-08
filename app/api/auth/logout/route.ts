import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logout } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    // If there's a token, find the session to revoke it
    let sessionId = undefined;
    
    if (token) {
      try {
        const session = await db.session.findFirst({
          where: { token, isRevoked: false },
          select: { id: true },
        });
        
        if (session) {
          sessionId = session.id;
        }
      } catch (error) {
        console.error('Error finding session:', error);
        // Continue even if session lookup fails
      }
    }
    
    // Check if a specific session ID was provided in the request
    const { sessionId: requestSessionId } = await req.json().catch(() => ({}));
    
    // Use the session ID from the request if provided, otherwise use the one we found
    const response = await logout(requestSessionId || sessionId);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
