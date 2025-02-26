import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { teamId: string } }) {
  try {
    const { teamId } = params;
    const { employeeId } = await req.json();

    // Add employee to team
    await db.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        teamId,
      },
    });

    return NextResponse.json({ message: 'Employee added to team successfully' });
  } catch (error) {
    console.error('Error adding employee to team:', error);
    return NextResponse.json({ error: 'Failed to add employee to team' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { teamId: string } }) {
  try {
    const { teamId } = params;
    const { employeeId } = await req.json();

    // Remove employee from team
    await db.employee.update({
      where: {
        id: employeeId,
        teamId: teamId, // Ensure employee belongs to this team
      },
      data: {
        teamId: null,
      },
    });

    return NextResponse.json({ message: 'Employee removed from team successfully' });
  } catch (error) {
    console.error('Error removing employee from team:', error);
    return NextResponse.json({ error: 'Failed to remove employee from team' }, { status: 500 });
  }
}
