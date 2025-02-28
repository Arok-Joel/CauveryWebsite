import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get admin token from cookies in headers
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find((c: string) => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get admin email
    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all employees with their reporting relationships
    const employees = await db.employee.findMany({
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
              },
            },
          },
        },
        subordinates: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        memberOfTeam: {
          include: {
            leader: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        leadsTeam: true,
      },
    });

    // Format the response to show reporting relationships
    const reportingStructure = employees.map(emp => ({
      id: emp.id,
      name: emp.user.name,
      email: emp.user.email,
      role: emp.employeeRole,
      reportsTo: emp.reportsTo ? {
        id: emp.reportsTo.id,
        name: emp.reportsTo.user.name,
        role: emp.reportsTo.employeeRole,
      } : null,
      subordinates: emp.subordinates.map(sub => ({
        id: sub.id,
        name: sub.user.name,
        role: sub.employeeRole,
      })),
      teamLeader: emp.memberOfTeam?.leader ? {
        id: emp.memberOfTeam.leader.id,
        name: emp.memberOfTeam.leader.user.name,
        role: emp.memberOfTeam.leader.employeeRole,
      } : null,
      isTeamLeader: emp.leadsTeam !== null,
    }));

    return NextResponse.json({ reportingStructure });
  } catch (error) {
    console.error('Debug reporting structure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 