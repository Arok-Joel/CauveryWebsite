import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as z from 'zod';

// Validate the promotion application request
const applySchema = z.object({
  condition: z.string(),
});

export async function POST(req: Request) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }
    
    const verified = await verifyAuth(token);
    
    if (!verified || verified.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the email from token - this is how we identify the user
    const email = verified.email;
    
    console.log('Verified token (apply):', JSON.stringify(verified));
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Get employee details using email instead of ID
    const user = await db.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user || !user.employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { condition } = applySchema.parse(body);

    // Check for existing pending request
    const existingRequest = await db.promotionRequest.findFirst({
      where: {
        employeeId: user.employee.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending promotion request' },
        { status: 400 }
      );
    }

    // Get next role for promotion
    const roleHierarchy = [
      'FIELD_OFFICER',
      'JOINT_DIRECTOR',
      'DIRECTOR',
      'EXECUTIVE_DIRECTOR',
    ];
    
    const currentRoleIndex = roleHierarchy.indexOf(user.employee.employeeRole);
    
    // If at the top role, can't be promoted further
    if (currentRoleIndex === -1 || currentRoleIndex === roleHierarchy.length - 1) {
      return NextResponse.json(
        { error: 'You are already at the highest role' },
        { status: 400 }
      );
    }
    
    const targetRole = roleHierarchy[currentRoleIndex + 1];

    // Create the promotion request
    const promotionRequest = await db.promotionRequest.create({
      data: {
        employeeId: user.employee.id,
        currentRole: user.employee.employeeRole,
        targetRole: targetRole as any, // Type assertion needed due to string vs enum
        condition,
      },
    });

    return NextResponse.json({
      message: 'Promotion request submitted successfully',
      request: promotionRequest,
    });
    
  } catch (error) {
    console.error('Error applying for promotion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit promotion request' },
      { status: 500 }
    );
  }
} 