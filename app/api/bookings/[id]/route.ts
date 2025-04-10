import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the booking ID from params
    const bookingId = params.id;
    
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

    // Get booking details
    const booking = await db.soldPlot.findUnique({
      where: { id: bookingId },
      include: {
        plot: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get employee details
    const employee = await db.employee.findUnique({
      where: { id: booking.employeeName },
      include: {
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

    // Format the response
    const response = {
      employeeId: employee.id,
      employeeName: employee.user.name,
      employeeRole: employee.employeeRole,
      plotNumber: booking.plotNumber,
      size: booking.size,
      price: booking.price,
      bookingDate: booking.soldAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch booking details" },
      { status: 500 }
    );
  }
} 