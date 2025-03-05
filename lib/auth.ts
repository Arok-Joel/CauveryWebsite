import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // Reduced from 24h to 2h for better security
    .sign(key);
}

export async function decrypt(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, key);
  return payload;
}

export async function verifyAuth(token: string) {
  try {
    const verified = await decrypt(token);
    
    // For admin users, we don't check the session in the database
    if (verified.role === 'ADMIN') {
      return verified;
    }
    
    // For employee users, we check the session in the database
    if (verified.role === 'EMPLOYEE' && verified.sessionId) {
      console.log('Checking session for employee:', verified.sessionId);
      
      // Check if the session exists and is valid in the database
      const session = await db.session.findUnique({
        where: {
          sessionToken: verified.sessionId,
          isValid: true,
        },
      });

      console.log('Session found:', session);

      if (!session || new Date(session.expires) < new Date()) {
        // Session expired or invalidated
        console.error('Session not found or expired:', verified.sessionId);
        return null;
      }
    }

    return verified;
  } catch (err) {
    console.error('Auth verification error:', err);
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

export async function createUserSession(user: { email: string; name: string; role: string; id?: string }) {
  // Get request metadata
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             'unknown';
             
  // Generate session token
  const sessionId = uuidv4();
  
  const token = await encrypt({
    email: user.email,
    name: user.name,
    role: user.role,
    sessionId,
    userAgent,
  });

  // Calculate expiration time (2 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  // Store session in database for non-admin users
  if (user.id && user.role !== 'ADMIN') {
    try {
      await db.session.create({
        data: {
          id: uuidv4(), // Generate a unique ID for the database record
          sessionToken: sessionId, // Use the same sessionId that's in the JWT
          userId: user.id,
          expires: expiresAt,
          userAgent,
          ipAddress: ip,
          isValid: true,
        },
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }

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

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Changed from 'lax' to 'strict'
    path: '/',
    maxAge: 60 * 60 * 2, // 2 hours (in seconds)
  });

  return { token, response };
}

export async function login(email: string, password: string) {
  // Verify admin credentials
  const isValidAdmin = await verifyAdminCredentials(email, password);

  if (isValidAdmin) {
    // For admin, we don't have a user ID in the database
    const { token } = await createUserSession({
      email,
      name: 'Admin',
      role: 'ADMIN',
    });
    return token;
  }

  return null;
}

export async function logout(token?: string) {
  // If token is provided, invalidate just that session
  if (token) {
    try {
      const decoded = await decrypt(token);
      if (decoded.sessionId && decoded.role !== 'ADMIN') {
        await db.session.update({
          where: { sessionToken: decoded.sessionId },
          data: { isValid: false },
        });
      }
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  const response = new NextResponse(JSON.stringify({ message: 'Logged out successfully' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Clear the auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  return response;
}

// New function to invalidate all sessions for a user
export async function logoutAllSessions(userId: string) {
  try {
    await db.session.updateMany({
      where: { 
        userId,
        isValid: true,
      },
      data: { 
        isValid: false 
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging out all sessions:', error);
    return { success: false };
  }
}

// New function to get all active sessions for a user
export async function getUserSessions(userId: string) {
  try {
    return await db.session.findMany({
      where: {
        userId,
        isValid: true,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
}
