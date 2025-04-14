import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { EmployeeRole } from '@prisma/client';
import * as z from 'zod';
import { hash } from 'bcryptjs';
import { getHierarchyLevelForRole } from '@/lib/employee-roles';

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      where: {
        isTerminated: false // Only get active (non-terminated) employees
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        leadsTeam: true,
      },
      orderBy: {
        employeeRole: 'asc',
      },
    });

    return NextResponse.json({
      employees: employees.map(employee => ({
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.employeeRole,
        isTeamLead: employee.leadsTeam !== null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    // Parse request body
    const body = await req.json();
    
    // Hash the password for the user account
    const hashedPassword = await hash(body.password || 'employee123', 10);
    
    // Create new user with employee profile
    const newUser = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        phone: body.phone,
        role: 'EMPLOYEE',
        employee: {
          create: {
            guardianName: body.guardianName,
            dateOfBirth: new Date(body.dateOfBirth),
            age: body.age,
            gender: body.gender,
            pancardNumber: body.pancardNumber,
            aadharCardNumber: body.aadharCardNumber,
            bankName: body.bankName,
            bankBranch: body.bankBranch,
            accountNumber: body.accountNumber,
            ifscCode: body.ifscCode,
            dateOfJoining: new Date(body.dateOfJoining),
            employeeRole: body.employeeRole as EmployeeRole,
            hierarchyLevel: getHierarchyLevelForRole(body.employeeRole as EmployeeRole),
            teamId: body.teamId || null,
            reportsToId: body.reportsToId || null,
          }
        }
      },
      include: {
        employee: true
      }
    });

    return NextResponse.json({
      message: 'Employee created successfully',
      employee: newUser.employee
    });
    
  } catch (error) {
    console.error('Error creating employee:', error);
    
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
