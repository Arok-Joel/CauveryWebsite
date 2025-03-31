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
      // Check if admin exists in database
      let adminUser = await db.user.findUnique({
        where: { email }
      });

      // If admin doesn't exist in database, create one
      if (!adminUser) {
        try {
          // Generate a random password hash - we don't need the actual password
          const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
          
          adminUser = await db.user.create({
            data: {
              email,
              name: 'Admin',
              password: hashedPassword,
              phone: '0000000000', // Placeholder
              role: 'ADMIN',
            },
          });
          console.log('Created admin user in database:', adminUser.id);
        } catch (error) {
          console.error('Error creating admin user in database:', error);
          // Continue even if we couldn't create the user
        }
      }

      const { response } = await createUserSession({
        email,
        name: 'Admin',
        role: 'ADMIN',
        id: adminUser?.id, // Use the ID if we have it
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
