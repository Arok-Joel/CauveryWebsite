import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        leadsTeam: true,
      },
      orderBy: {
        employeeRole: 'asc',
      },
    });

    return NextResponse.json({
      employees: employees.map(employee => ({
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.employeeRole,
        isTeamLead: employee.leadsTeam !== null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
