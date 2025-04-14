import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    // Verify token
    const verified = await verifyAuth(token);

    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check if user has admin role
    if (verified.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Only admins can view employees' }, { status: 401 });
    }

    // Get all employees with their user details
    const employees = await db.employee.findMany({
      where: {
        isTerminated: false // Only include active employees
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format the response
    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.user.name,
      employeeRole: employee.employeeRole,
    }));

    return NextResponse.json(formattedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch employees" },
      { status: 500 }
    );
  }
} 