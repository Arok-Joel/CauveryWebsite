import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { createUserSession, decrypt } from '@/lib/auth';

const loginSchema = z.object({
  employeeId: z.string().regex(/^RCF\d{7}$/),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, password } = loginSchema.parse(body);

    // Find employee by ID
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
          }
        }
      }
    });

    if (!employee || !employee.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = employee.user;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session for employee
    const { response, token } = await createUserSession({
      email: user.email,
      name: user.name,
      role: user.role,
      id: user.id, // Pass the user ID for session tracking
    });

    // Debug: Log the token and decoded token
    console.log('Created token:', token);
    const decoded = await decrypt(token);
    console.log('Decoded token:', decoded);

    // Return the response directly
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Employee login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
