import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
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

    // Fetch terminated employees
    const terminatedEmployees = await db.employee.findMany({
      where: {
        isTerminated: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        terminationDate: 'desc',
      },
    });

    return NextResponse.json({
      employees: terminatedEmployees.map(employee => ({
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.employeeRole,
        terminationDate: employee.terminationDate,
      })),
    });
  } catch (error) {
    console.error('Error fetching terminated employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terminated employees' },
      { status: 500 }
    );
  }
} 