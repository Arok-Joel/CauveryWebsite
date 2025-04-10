import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getHierarchyLevelForRole } from '@/lib/employee-roles';
import { EmployeeRole } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    console.log('Fetching employee with ID:', employeeId);
    
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!employee) {
      console.log('Employee not found:', employeeId);
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const response = {
      id: employee.id,
      name: employee.user.name,
      employeeRole: employee.employeeRole,
    };
    
    console.log('Returning employee details:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;
    
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }
    
    const verified = await verifyAuth(token);
    
    if (!verified || verified.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await req.json();
    
    // Check if employee exists
    const existingEmployee = await db.employee.findUnique({
      where: { id: employeeId },
    });
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Prepare update data with hierarchy level if role is changing
    const updateData = { ...body };
    
    // If employee role is changing, update the hierarchy level
    if (body.employeeRole && body.employeeRole !== existingEmployee.employeeRole) {
      updateData.hierarchyLevel = getHierarchyLevelForRole(body.employeeRole as EmployeeRole);
    }
    
    // Update employee
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
        reportsTo: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });
    
    // Also update the user information if provided
    if (body.name || body.email || body.phone) {
      await db.user.update({
        where: { id: updatedEmployee.userId },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
        }
      });
    }
    
    return NextResponse.json({
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
    
  } catch (error) {
    console.error('Error updating employee:', error);
    
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
} 