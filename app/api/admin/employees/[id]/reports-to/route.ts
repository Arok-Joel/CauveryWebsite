import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const updateReportsToSchema = z.object({
  reportsToId: z.string().min(1),
});

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    // Extract the employee ID from context params
    const employeeId = context.params.id;
    
    const body = await req.json();
    const { reportsToId } = updateReportsToSchema.parse(body);

    // Get both employees to verify hierarchy levels
    const [employee, manager] = await Promise.all([
      db.employee.findUnique({
        where: { id: employeeId },
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

    // Verify hierarchy levels
    // A lower hierarchy level number means a higher position in the organization
    if (manager.hierarchyLevel >= employee.hierarchyLevel) {
      return NextResponse.json(
        {
          error: `Invalid reporting structure. Manager's hierarchy level (${manager.hierarchyLevel}) must be lower than employee's hierarchy level (${employee.hierarchyLevel}).`,
        },
        { status: 400 }
      );
    }

    // Update the reporting relationship
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
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
