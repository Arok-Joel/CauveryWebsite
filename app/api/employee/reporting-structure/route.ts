import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { EmployeeRole } from '@prisma/client';
import { cookies } from 'next/headers';

// Define role hierarchy for validation
const roleHierarchy: Record<EmployeeRole, number> = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4,
};

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the employee with their reporting structure
    const employee = await db.employee.findFirst({
      where: {
        user: {
          email: verified.email,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        reportsTo: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            reportsTo: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        subordinates: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            employeeRole: 'asc',
          },
        },
        memberOfTeam: {
          include: {
            leader: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all direct reports (subordinates) IDs for deduplication
    const subordinateIds = new Set(employee.subordinates.map(sub => sub.id));

    // Determine the manager based on reportsTo or team leader
    let manager = null;
    let managerOfManager = null;
    
    // First check if employee reports to someone
    if (employee.reportsTo) {
      manager = {
        id: employee.reportsTo.id,
        name: employee.reportsTo.user.name,
        role: employee.reportsTo.employeeRole,
        email: employee.reportsTo.user.email,
      };
      
      // Check if manager reports to someone
      if (employee.reportsTo.reportsTo) {
        managerOfManager = {
          id: employee.reportsTo.reportsTo.id,
          name: employee.reportsTo.reportsTo.user.name,
          role: employee.reportsTo.reportsTo.employeeRole,
          email: employee.reportsTo.reportsTo.user.email,
        };
      }
    } 
    // If no direct reporting relationship, check if part of a team
    else if (employee.memberOfTeam && employee.memberOfTeam.leader && employee.memberOfTeam.leader.id !== employee.id) {
      manager = {
        id: employee.memberOfTeam.leader.id,
        name: employee.memberOfTeam.leader.user.name,
        role: employee.memberOfTeam.leader.employeeRole,
        email: employee.memberOfTeam.leader.user.email,
        isTeamLead: true,
      };
    }

    // Format subordinates
    const subordinates = employee.subordinates.map(sub => ({
      id: sub.id,
      name: sub.user.name,
      role: sub.employeeRole,
      email: sub.user.email,
    }));

    // Format response
    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.user.name,
        role: employee.employeeRole,
        email: employee.user.email,
      },
      manager,
      managerOfManager,
      subordinates,
      team: employee.memberOfTeam 
        ? {
            id: employee.memberOfTeam.id,
            leader: employee.memberOfTeam.leader 
              ? {
                  id: employee.memberOfTeam.leader.id,
                  name: employee.memberOfTeam.leader.user.name,
                  role: employee.memberOfTeam.leader.employeeRole,
                  email: employee.memberOfTeam.leader.user.email,
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching reporting structure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 