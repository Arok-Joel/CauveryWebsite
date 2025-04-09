import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { EmployeeRole } from '@prisma/client';

// This endpoint gets information about subordinates of an employee being promoted
// and potential new managers for reassignment
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

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

    // Get the employee details separately
    const employee = await db.employee.findUnique({
      where: { id: promotionRequest.employeeId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const currentRole = employee.employeeRole;
    const teamId = employee.teamId;
    
    // Find subordinates who report to this employee
    const subordinates = await db.employee.findMany({
      where: {
        reportsToId: employee.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc',
        }
      }
    });

    // Find potential new managers (depends on the employee's current role)
    let potentialManagers: any[] = [];

    // We no longer need to find potential managers for any promotion type
    // All subordinates will continue reporting to their promoted manager

    return NextResponse.json({
      employeeBeingPromoted: {
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        currentRole: employee.employeeRole,
        targetRole: promotionRequest.targetRole,
      },
      subordinates: subordinates.map(sub => ({
        id: sub.id,
        name: sub.user.name, 
        email: sub.user.email,
        role: sub.employeeRole,
      })),
      potentialManagers: [],
    });
    
  } catch (error) {
    console.error('Error getting subordinates information:', error);
    return NextResponse.json(
      { error: 'Failed to get subordinates information' },
      { status: 500 }
    );
  }
} 