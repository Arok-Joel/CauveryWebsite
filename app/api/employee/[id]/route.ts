import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching employee with ID:', params.id);
    
    const employee = await db.employee.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!employee) {
      console.log('Employee not found:', params.id);
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