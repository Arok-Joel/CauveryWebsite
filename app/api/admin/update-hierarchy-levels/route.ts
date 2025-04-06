import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { updateAllEmployeeHierarchyLevels, updateEmployeeHierarchyLevel } from '@/lib/setup-hierarchy-levels';

// This endpoint updates hierarchy levels for all employees
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

    // Update all hierarchy levels
    const result = await updateAllEmployeeHierarchyLevels();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating hierarchy levels:', error);
    return NextResponse.json(
      { error: 'Failed to update hierarchy levels' },
      { status: 500 }
    );
  }
}

// This endpoint updates hierarchy level for a specific employee
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

    // Get the employee ID from the request body
    const { employeeId } = await req.json();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Update the hierarchy level for the specified employee
    const result = await updateEmployeeHierarchyLevel(employeeId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating hierarchy level:', error);
    return NextResponse.json(
      { error: 'Failed to update hierarchy level' },
      { status: 500 }
    );
  }
} 