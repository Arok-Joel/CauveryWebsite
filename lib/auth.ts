import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

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

export async function createUserSession(user: { email: string; name: string; role: string }) {
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

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
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

  // Clear the auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });

  return response;
}
