import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as z from 'zod';

// Validate the reassignment request
const reassignSchema = z.object({
  reassignments: z.array(
    z.object({
      subordinateId: z.string(),
      newManagerId: z.string(),
    })
  ),
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
    const { reassignments } = reassignSchema.parse(body);

    // Get the promotion request
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

    // Process reassignments in a transaction
    const result = await db.$transaction(async (tx) => {
      const updates = [];

      // Process each reassignment
      for (const { subordinateId, newManagerId } of reassignments) {
        // Verify the subordinate exists and reports to the employee being promoted
        const subordinate = await tx.employee.findFirst({
          where: {
            id: subordinateId,
            reportsToId: promotionRequest.employeeId,
          },
          include: {
            user: {
              select: { name: true }
            }
          }
        });

        if (!subordinate) {
          continue; // Skip if not found or not a direct subordinate
        }

        // Verify the new manager exists
        const newManager = await tx.employee.findUnique({
          where: { id: newManagerId },
          include: {
            user: {
              select: { name: true }
            }
          }
        });

        if (!newManager) {
          continue; // Skip if new manager not found
        }

        // Update the subordinate's manager
        await tx.employee.update({
          where: { id: subordinateId },
          data: { reportsToId: newManagerId },
        });

        updates.push({
          subordinate: {
            id: subordinate.id,
            name: subordinate.user.name,
          },
          newManager: {
            id: newManager.id,
            name: newManager.user.name,
          }
        });
      }

      return { updates };
    });

    return NextResponse.json({
      message: 'Subordinates reassigned successfully',
      updates: result.updates,
    });
    
  } catch (error) {
    console.error('Error reassigning subordinates:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to reassign subordinates' },
      { status: 500 }
    );
  }
} 