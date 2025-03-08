import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { UAParser } from 'ua-parser-js';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, key);
  return payload;
}

export async function verifyAuth(token: string) {
  try {
    const verified = await decrypt(token);
    return verified;
  } catch (err) {
    return null;
  }
}

export async function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('Admin credentials not configured');
  }

  if (email !== adminEmail) {
    return false;
  }

  // For the predefined admin, we compare the password directly
  return password === adminPassword;
}

export async function createUserSession(user: { email: string; name: string; role: string }, request?: Request) {
  const token = await encrypt({
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = new NextResponse(
    JSON.stringify({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Logged in successfully',
    })
  );

  // Set cookie
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  });

  // Store session in database if it's not an admin
  if (user.role !== 'ADMIN' && request) {
    try {
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (dbUser) {
        // Get user agent and IP
        const userAgent = request.headers.get('user-agent') || '';
        const ipAddress = request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          'unknown';
        
        // Parse user agent for better display
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();
        
        const userAgentInfo = `${browser.name || ''} ${browser.version || ''} on ${os.name || ''} ${os.version || ''} ${device.type ? `(${device.type})` : ''}`.trim();

        // Create session in database
        await db.session.create({
          data: {
            userId: dbUser.id,
            token,
            userAgent: userAgentInfo || userAgent,
            ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
          },
        });
      }
    } catch (error) {
      console.error('Error creating session record:', error);
      // Continue even if session record creation fails
    }
  }

  return { token, response };
}

export async function login(email: string, password: string) {
  // Verify admin credentials
  const isValidAdmin = await verifyAdminCredentials(email, password);

  if (isValidAdmin) {
    const { token } = await createUserSession({
      email,
      name: 'Admin',
      role: 'ADMIN',
    });
    return token;
  }

  return null;
}

export async function logout(sessionId?: string) {
  const response = new NextResponse(JSON.stringify({ message: 'Logged out successfully' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Clear the auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });

  // If sessionId is provided, revoke that specific session
  if (sessionId) {
    try {
      await db.session.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      });
    } catch (error) {
      console.error('Error revoking session:', error);
      // Continue even if session revocation fails
    }
  }

  return response;
}

// New functions for session management

export async function getUserSessions(userId: string) {
  try {
    const sessions = await db.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
    });
    
    return sessions;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
}

export async function revokeSession(sessionId: string) {
  try {
    await db.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
    return true;
  } catch (error) {
    console.error('Error revoking session:', error);
    return false;
  }
}

export async function revokeAllSessionsExcept(userId: string, currentSessionToken: string) {
  try {
    await db.session.updateMany({
      where: {
        userId,
        token: {
          not: currentSessionToken,
        },
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
    return true;
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    return false;
  }
}

export async function updateSessionActivity(token: string) {
  try {
    await db.session.updateMany({
      where: { token, isRevoked: false },
      data: { lastActive: new Date() },
    });
    return true;
  } catch (error) {
    console.error('Error updating session activity:', error);
    return false;
  }
}
