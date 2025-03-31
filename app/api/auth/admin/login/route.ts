import { NextResponse } from 'next/server';
import * as z from 'zod';
import { createUserSession, verifyAdminCredentials } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

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

    // Check if admin exists in database
    let adminUser = await db.user.findUnique({
      where: { email }
    });

    // If admin doesn't exist in database, create one
    if (!adminUser) {
      try {
        // Generate a random password hash - we don't need the actual password since
        // we authenticate admin using environment variables
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

    // Create session for admin
    const { response } = await createUserSession({
      email,
      name: 'Admin',
      role: 'ADMIN',
      id: adminUser?.id, // Use the ID if we have it
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
