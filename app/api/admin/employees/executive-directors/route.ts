import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('Fetching executive directors...');
    const executiveDirectors = await db.employee.findMany({
      where: {
        employeeRole: 'EXECUTIVE_DIRECTOR',
      },
      select: {
        id: true,
        employeeRole: true,
        hierarchyLevel: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('Found executive directors:', executiveDirectors.length, executiveDirectors);

    return NextResponse.json({
      executiveDirectors: executiveDirectors.map(director => ({
        id: director.id,
        name: director.user.name,
        role: director.employeeRole,
        hierarchyLevel: director.hierarchyLevel,
      })),
    });
  } catch (error) {
    console.error('Error fetching executive directors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
