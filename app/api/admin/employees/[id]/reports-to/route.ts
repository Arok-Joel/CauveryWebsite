import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const updateReportsToSchema = z.object({
  reportsToId: z.string().min(1),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { reportsToId } = updateReportsToSchema.parse(body);

    // Get both employees to verify roles
    const [employee, manager] = await Promise.all([
      db.employee.findUnique({
        where: { id: params.id },
        include: { user: true },
      }),
      db.employee.findUnique({
        where: { id: reportsToId },
        include: { user: true },
      }),
    ]);

    if (!employee || !manager) {
      return NextResponse.json({ error: 'Employee or manager not found' }, { status: 404 });
    }

    // Verify role hierarchy
    const roleHierarchy = {
      EXECUTIVE_DIRECTOR: 0,
      DIRECTOR: 1,
      JOINT_DIRECTOR: 2,
      FIELD_OFFICER: 3,
    };

    if (roleHierarchy[manager.employeeRole] >= roleHierarchy[employee.employeeRole]) {
      return NextResponse.json(
        {
          error: "Invalid reporting structure. Manager's role must be higher than employee's role.",
        },
        { status: 400 }
      );
    }

    // Update the reporting relationship
    const updatedEmployee = await db.employee.update({
      where: { id: params.id },
      data: { reportsToId },
      include: {
        user: true,
        reportsTo: {
          include: {
            user: true,
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
