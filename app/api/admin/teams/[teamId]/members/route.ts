import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const addMemberSchema = z.object({
  employeeId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const body = await req.json();
    const { employeeId } = addMemberSchema.parse(body);

    // Verify the team exists
    const team = await db.team.findUnique({
      where: { id: params.teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify the employee exists and is not already in a team
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        memberOfTeam: true,
        leadsTeam: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if employee is already in a team
    if (employee.teamId) {
      return NextResponse.json(
        { error: 'Employee is already a member of a team' },
        { status: 400 }
      );
    }

    // Check if employee is an Executive Director (they can't be team members)
    if (employee.employeeRole === 'EXECUTIVE_DIRECTOR') {
      return NextResponse.json(
        { error: 'Executive Directors cannot be team members' },
        { status: 400 }
      );
    }

    // Add the employee to the team
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: { teamId: params.teamId },
      include: {
        user: true,
        memberOfTeam: {
          include: {
            leader: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const { employeeId } = await req.json();

    // Remove employee from team and reset reporting relationship
    await db.employee.update({
      where: {
        id: employeeId,
        teamId: params.teamId, // Ensure employee belongs to this team
      },
      data: {
        teamId: null,
        reportsToId: null, // Reset reporting relationship
      },
    });

    // Also update any employees that report to this employee
    await db.employee.updateMany({
      where: {
        reportsToId: employeeId,
      },
      data: {
        reportsToId: null,
      },
    });

    return NextResponse.json({ message: 'Employee removed from team successfully' });
  } catch (error) {
    console.error('Error removing employee from team:', error);
    return NextResponse.json({ error: 'Failed to remove employee from team' }, { status: 500 });
  }
}
