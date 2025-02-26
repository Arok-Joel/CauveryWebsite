import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const executiveDirectors = await db.employee.findMany({
      where: {
        AND: [
          { employeeRole: 'EXECUTIVE_DIRECTOR' },
          { leadsTeam: null }, // Only get those who don't lead any team
          { memberOfTeam: null }, // And are not members of any team
        ],
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      executiveDirectors: executiveDirectors.map(director => ({
        id: director.id,
        name: director.user.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching executive directors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
