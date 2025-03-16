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

    if (verified.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized - Not an employee' }, { status: 401 });
    }

    // Get user and employee data
    const user = await db.user.findUnique({
      where: { email: verified.email },
      include: {
        employee: true,
      },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all commissions for this employee from the commission table
    const employeeCommissions = await db.commission.findMany({
      where: {
        employeeId: user.employee.id
      },
      include: {
        soldPlot: {
          include: {
            plot: true
          }
        }
      }
    });

    // Format the commissions data
    const commissions = employeeCommissions.map(commission => {
      const soldPlot = commission.soldPlot;
      const saleAmount = parseFloat(soldPlot.price);
      
      return {
        plotId: soldPlot.plotId,
        plotNumber: soldPlot.plotNumber,
        saleAmount,
        commissionPercentage: commission.percentage,
        commissionAmount: parseFloat(commission.amount.toString()),
        soldAt: soldPlot.soldAt || new Date(),
        customerName: soldPlot.customerName
      };
    });

    // Calculate total commission
    const totalCommission = commissions.reduce((total, commission) => total + commission.commissionAmount, 0);

    return NextResponse.json({
      employee: {
        id: user.employee.id,
        name: user.name,
        role: user.employee.employeeRole
      },
      commissions,
      totalCommission,
      totalSales: commissions.length
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch commissions" },
      { status: 500 }
    );
  }
} 