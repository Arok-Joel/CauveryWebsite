import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    console.log('Fetching available employees for team:', teamId);

    // Get all employees who are not part of this team and are not executive directors
    const availableEmployees = await db.employee.findMany({
      where: {
        AND: [
          {
            employeeRole: {
              not: 'EXECUTIVE_DIRECTOR',
            },
          },
          {
            OR: [{ leadsTeam: null }, { leadsTeam: { id: { not: teamId } } }],
          },
          {
            OR: [{ teamId: null }, { teamId: { not: teamId } }],
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('Found available employees:', availableEmployees.length);
    return NextResponse.json({ employees: availableEmployees });
  } catch (error) {
    console.error('Error fetching available employees:', error);
    return NextResponse.json({ error: 'Failed to fetch available employees' }, { status: 500 });
  }
}
