import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import * as z from 'zod';

const fixReportingSchema = z.object({
  employeeId: z.string(),
  reportsToId: z.string().nullable(),
});

export async function POST(req: Request) {
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

    const body = await req.json();
    const { employeeId, reportsToId } = fixReportingSchema.parse(body);

    // Check for circular references
    if (reportsToId) {
      const manager = await db.employee.findUnique({
        where: { id: reportsToId },
        include: {
          reportsTo: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }

      // Check if this would create a circular reference
      let currentManagerId = manager.reportsToId;
      while (currentManagerId) {
        if (currentManagerId === employeeId) {
          return NextResponse.json(
            { error: 'Cannot create circular reporting relationship' },
            { status: 400 }
          );
        }

        // Get the next manager up
        const nextManager = await db.employee.findUnique({
          where: { id: currentManagerId },
          select: { reportsToId: true },
        });
        
        if (!nextManager) break;
        currentManagerId = nextManager.reportsToId;
      }
    }

    // Update the employee's reporting relationship
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

    return NextResponse.json({
      success: true,
      employee: {
        id: updatedEmployee.id,
        name: updatedEmployee.user.name,
        role: updatedEmployee.employeeRole,
        reportsTo: updatedEmployee.reportsTo
          ? {
              id: updatedEmployee.reportsTo.id,
              name: updatedEmployee.reportsTo.user.name,
              role: updatedEmployee.reportsTo.employeeRole,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Fix reporting structure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 