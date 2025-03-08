import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { createUserSession } from '@/lib/auth';

const loginSchema = z.object({
  employeeId: z.string().regex(/^RCF\d{7}$/),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  // Add a unique request ID for tracing
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Employee login attempt`);
  
  try {
    const body = await req.json();
    const { employeeId, password } = loginSchema.parse(body);
    
    console.log(`[${requestId}] Login attempt for employee ID: ${employeeId}`);

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
      console.log(`[${requestId}] Invalid credentials - employee or user not found`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = employee.user;

    if (!user) {
      console.log(`[${requestId}] Invalid credentials - user not found`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[${requestId}] Invalid credentials - password mismatch`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log(`[${requestId}] Login successful for employee: ${user.email} (${user.name})`);
    
    // Create session for employee
    const { response } = await createUserSession({
      email: user.email,
      name: user.name,
      role: user.role,
    });
    
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    console.log(`[${requestId}] Session created for employee: ${user.email}`);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(`[${requestId}] Validation error:`, error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error(`[${requestId}] Employee login error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
