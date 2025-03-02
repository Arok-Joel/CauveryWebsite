import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const roleUpdateSchema = z.object({
  role: z.enum(['EXECUTIVE_DIRECTOR', 'DIRECTOR', 'JOINT_DIRECTOR', 'FIELD_OFFICER']),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const params = await context.params;
    const body = await req.json();
    const { role } = roleUpdateSchema.parse(body);

    // Get the employee with their current role and team information
    const employee = await db.employee.findUnique({
      where: { id: params.id },
      include: {
        leadsTeam: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // If the employee is currently an Executive Director and leads a team
    if (employee.employeeRole === 'EXECUTIVE_DIRECTOR' && employee.leadsTeam) {
      // If trying to change to a different role, prevent it
      if (role !== 'EXECUTIVE_DIRECTOR') {
        return NextResponse.json(
          {
            error:
              'Cannot change role: This Executive Director is currently leading a team. Please assign a new team leader first.',
          },
          { status: 400 }
        );
      }
    }

    // If changing to Executive Director, check if they're already in a team as a member
    if (role === 'EXECUTIVE_DIRECTOR') {
      const teamMembership = await db.employee.findUnique({
        where: { id: params.id },
        select: { teamId: true },
      });

      if (teamMembership?.teamId) {
        return NextResponse.json(
          {
            error:
              'Cannot promote to Executive Director: Employee is currently a member of a team. Please remove them from the team first.',
          },
          { status: 400 }
        );
      }
    }

    const updatedEmployee = await db.employee.update({
      where: { id: params.id },
      data: { employeeRole: role },
      include: {
        user: true,
        leadsTeam: true,
        memberOfTeam: true,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    // Log the error for debugging
    console.error('Error updating employee role:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update employee role: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while updating employee role' },
      { status: 500 }
    );
  }
}
