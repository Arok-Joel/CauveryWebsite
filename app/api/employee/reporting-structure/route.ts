import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { EmployeeRole } from '@prisma/client';

// Define role hierarchy for validation
const roleHierarchy: Record<EmployeeRole, number> = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4,
};

export async function GET(req: Request) {
  try {
    // Get auth token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find((c: string) => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

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

    if (employee.reportsTo) {
      manager = {
        id: employee.reportsTo.id,
        name: employee.reportsTo.user.name,
        email: employee.reportsTo.user.email,
        role: employee.reportsTo.employeeRole,
      };

      if (employee.reportsTo.reportsTo) {
        managerOfManager = {
          id: employee.reportsTo.reportsTo.id,
          name: employee.reportsTo.reportsTo.user.name,
          email: employee.reportsTo.reportsTo.user.email,
          role: employee.reportsTo.reportsTo.employeeRole,
        };
      }
    } else if (employee.memberOfTeam && employee.employeeRole !== 'EXECUTIVE_DIRECTOR') {
      // If no direct manager but part of a team, the team leader is the manager
      manager = {
        id: employee.memberOfTeam.leader.id,
        name: employee.memberOfTeam.leader.user.name,
        email: employee.memberOfTeam.leader.user.email,
        role: employee.memberOfTeam.leader.employeeRole,
      };
    }

    // Filter out any subordinates that are also managers to prevent circular references
    const filteredSubordinates = employee.subordinates.filter(sub => {
      // If this subordinate is also the manager or manager's manager, exclude it
      if (manager && sub.id === manager.id) return false;
      if (managerOfManager && sub.id === managerOfManager.id) return false;
      return true;
    });

    // Format the reporting structure
    const reportingStructure = {
      self: {
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.employeeRole,
      },
      manager: manager,
      managerOfManager: managerOfManager,
      directReports: filteredSubordinates.map(report => ({
        id: report.id,
        name: report.user.name,
        email: report.user.email,
        role: report.employeeRole,
      })),
    };

    return NextResponse.json({ reportingStructure });
  } catch (error) {
    console.error('Reporting structure fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 