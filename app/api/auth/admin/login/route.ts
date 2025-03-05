import { NextResponse } from 'next/server';
import * as z from 'zod';
import { createUserSession, verifyAdminCredentials } from '@/lib/auth';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = adminLoginSchema.parse(body);

    // Verify admin credentials
    const isValidAdmin = await verifyAdminCredentials(email, password);
    if (!isValidAdmin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Create session for admin
    const { response } = await createUserSession({
      email,
      name: 'Admin',
      role: 'ADMIN',
    });

    // Return the response directly without modifying it
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
