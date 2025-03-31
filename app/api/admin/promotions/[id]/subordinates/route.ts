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
    
    // If Joint Director being promoted to Director, find other Joint Directors in the same team
    if (currentRole === EmployeeRole.JOINT_DIRECTOR && promotionRequest.targetRole === EmployeeRole.DIRECTOR) {
      potentialManagers = await db.employee.findMany({
        where: {
          teamId: teamId,
          employeeRole: EmployeeRole.JOINT_DIRECTOR,
          id: { not: employee.id }, // Exclude the employee being promoted
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          // Include count of current subordinates to help with distribution
          subordinates: {
            select: {
              id: true,
            }
          }
        },
        orderBy: {
          user: {
            name: 'asc',
          }
        }
      });
    }
    // If Director being promoted to Executive Director, find other Directors in the same team
    else if (currentRole === EmployeeRole.DIRECTOR && promotionRequest.targetRole === EmployeeRole.EXECUTIVE_DIRECTOR) {
      potentialManagers = await db.employee.findMany({
        where: {
          teamId: teamId,
          employeeRole: EmployeeRole.DIRECTOR,
          id: { not: employee.id }, // Exclude the employee being promoted
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          subordinates: {
            select: {
              id: true,
            }
          }
        },
        orderBy: {
          user: {
            name: 'asc',
          }
        }
      });
    }

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
      potentialManagers: potentialManagers.map(manager => ({
        id: manager.id,
        name: manager.user.name,
        email: manager.user.email,
        role: manager.employeeRole,
        currentSubordinatesCount: manager.subordinates.length,
      })),
    });
    
  } catch (error) {
    console.error('Error getting subordinates information:', error);
    return NextResponse.json(
      { error: 'Failed to get subordinates information' },
      { status: 500 }
    );
  }
} 