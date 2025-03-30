import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as z from 'zod';

// Validate the promotion processing request
const processSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }
    
    const verified = await verifyAuth(token);
    
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { status } = processSchema.parse(body);

    // Fetch the promotion request
    const promotionRequest = await db.promotionRequest.findUnique({
      where: { id },
    });

    if (!promotionRequest) {
      return NextResponse.json(
        { error: 'Promotion request not found' },
        { status: 404 }
      );
    }

    if (promotionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This promotion request has already been processed' },
        { status: 400 }
      );
    }

    // Get the employee details
    const employee = await db.employee.findUnique({
      where: { id: promotionRequest.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Process the request in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the promotion request status
      const updatedRequest = await tx.promotionRequest.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedById: null,
        },
      });

      // If approved, update the employee's role
      if (status === 'APPROVED') {
        const updatedEmployee = await tx.employee.update({
          where: { id: employee.id },
          data: {
            employeeRole: promotionRequest.targetRole,
          },
        });
        
        return { updatedRequest, updatedEmployee };
      }
      
      return { updatedRequest };
    });

    // Return success response
    return NextResponse.json({
      message: `Promotion request ${status.toLowerCase()}`,
      promotionRequest: result.updatedRequest,
    });
    
  } catch (error) {
    console.error('Error processing promotion request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process promotion request' },
      { status: 500 }
    );
  }
} 