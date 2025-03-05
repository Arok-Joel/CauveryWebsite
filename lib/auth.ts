import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Remove the fallback secret key to prevent session mixing
const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Add environment-specific salt to the secret key
const environmentSalt = process.env.NODE_ENV === 'production' ? 'prod-' : 'dev-';
const enhancedSecretKey = `${environmentSalt}${secretKey}`;
const key = new TextEncoder().encode(enhancedSecretKey);

export async function encrypt(payload: any) {
  // Add a unique fingerprint to each token
  const tokenFingerprint = `${payload.email}-${Date.now()}-${crypto.randomUUID()}`;
  
  return await new SignJWT({
    ...payload,
    fingerprint: tokenFingerprint
  })
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

export async function createUserSession(user: { email: string; name: string; role: string; id?: string }) {
  // Generate a unique session ID
  const sessionId = crypto.randomUUID();
  
  const token = await encrypt({
    email: user.email,
    name: user.name,
    role: user.role,
    // Include the user's ID if available
    userId: user.id || `user-${crypto.randomUUID()}`,
    // Add a unique identifier to each token to prevent session mixing
    sessionId: sessionId,
    // Add timestamp to further ensure uniqueness
    issuedAt: Date.now(),
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

  // Set SameSite to None for cross-domain usage (Netlify to Supabase)
  // But only if in production and with secure flag
  const sameSiteSetting = process.env.NODE_ENV === 'production' ? 'none' : 'strict';
  const secureSetting = process.env.NODE_ENV === 'production';
  
  // Generate a unique cookie name for each user to prevent session mixing
  const cookieName = `auth-token-${user.id || crypto.randomUUID().slice(0, 8)}`;

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: secureSetting,
    sameSite: sameSiteSetting,
    maxAge: 60 * 60 * 24, // 1 day
    path: '/', // Ensure cookie is available across the site
  });
  
  // Also set the standard auth-token for backward compatibility
  // but with a shorter expiration
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: secureSetting,
    sameSite: sameSiteSetting,
    maxAge: 60 * 60 * 24, // 1 day
    path: '/', // Ensure cookie is available across the site
  });

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

export async function logout() {
  const response = new NextResponse(JSON.stringify({ message: 'Logged out successfully' }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get all cookies from the request
  const cookieHeader = response.headers.get('cookie');
  const cookies = cookieHeader ? cookieHeader.split(';').map(c => c.trim()) : [];
  
  // Clear the standard auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 0, // Expire immediately
    path: '/',
  });
  
  // Clear any user-specific auth cookies
  for (const cookie of cookies) {
    if (cookie.startsWith('auth-token-')) {
      const cookieName = cookie.split('=')[0];
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0, // Expire immediately
        path: '/',
      });
    }
  }

  return response;
}
