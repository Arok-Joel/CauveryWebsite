import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { createUserSession, verifyAdminCredentials } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // First, try admin login
    const isAdmin = await verifyAdminCredentials(email, password);
    if (isAdmin) {
      const { response } = await createUserSession({
        email,
        name: 'Admin',
        role: 'ADMIN',
      });
      return response;
    }

    // If not admin, try regular user login
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session for regular user
    const { response } = await createUserSession({
      email: user.email,
      name: user.name,
      role: user.role,
      id: user.id, // Pass the user ID for session tracking
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
