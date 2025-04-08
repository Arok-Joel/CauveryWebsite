import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { EmployeeRole } from "@prisma/client";
import { sendPlotBookingConfirmationEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
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
      return NextResponse.json({ error: 'Unauthorized - Only admins can book plots' }, { status: 401 });
    }

    const data = await request.json();
    const {
      plotId,
      plotNumber,
      size,
      plotAddress,
      price,
      dimensions,
      facing,
      employeeId,
      customerName,
      phoneNumber,
      email,
      address,
      aadhaarNumber,
    } = data;

    // Validate that all required fields are present
    if (!plotId || !plotNumber || !size || !plotAddress || !price || !dimensions || 
        !facing || !employeeId || !customerName || !phoneNumber || !email || !address || !aadhaarNumber) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if plot exists and is available before starting transaction
    const existingPlot = await db.plot.findUnique({
      where: { id: plotId },
    });

    if (!existingPlot) {
      return NextResponse.json(
        { error: "Plot not found" },
        { status: 404 }
      );
    }

    if (existingPlot.status.toLowerCase() !== "available") {
      return NextResponse.json(
        { error: "Plot is not available for booking" },
        { status: 400 }
      );
    }

    // Get employee details
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
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Calculate commission based on employee role
    const saleAmount = parseFloat(price);
    
    // Get the team hierarchy for commission distribution
    const teamHierarchy = await getTeamHierarchy(employeeId);
    if (!teamHierarchy) {
      return NextResponse.json(
        { error: "Failed to determine team hierarchy" },
        { status: 500 }
      );
    }
    
    // Calculate commissions for all team members
    const commissions = calculateCommissions(
      employee.employeeRole,
      employeeId,
      saleAmount,
      teamHierarchy
    );
    
    console.log('Calculated commissions:', commissions);

    // Use a transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (prisma) => {
      // Create the sold plot record
      const soldPlot = await prisma.soldPlot.create({
        data: {
          plotNumber,
          size,
          plotAddress,
          price,
          dimensions,
          facing,
          employeeName: employee.user.name,
          customerName,
          phoneNumber,
          email,
          address,
          aadhaarNumber,
          plotId,
        },
      });

      // Update the plot status to "sold"
      const updatedPlot = await prisma.plot.update({
        where: { id: plotId },
        data: { status: "sold" },
      });

      // Create commission records for all team members
      const commissionRecords = await Promise.all(
        commissions.map(comm => 
          prisma.commission.create({
            data: {
              amount: comm.amount,
              percentage: comm.percentage,
              employeeId: comm.employeeId,
              employeeRole: comm.employeeRole,
              soldPlotId: soldPlot.id,
            },
          })
        )
      );

      // Send confirmation email to customer
      try {
        await sendPlotBookingConfirmationEmail({
          to: email,
          customerName,
          plotNumber,
          size,
          price: parseFloat(price),
          dimensions,
          facing,
          plotAddress,
          phoneNumber,
          email,
          address,
          aadhaarNumber,
          employeeId,
          employeeName: employee.user.name,
          employeeRole: employee.employeeRole,
        });
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Continue with response even if email fails
      }

      return { soldPlot, updatedPlot, commission: commissionRecords };
    }, {
      timeout: 30000, // 30 second timeout for transaction
      maxWait: 5000,  // Maximum wait time for available connection
    });

    return NextResponse.json(result);
  } catch (txError) {
    console.error("Transaction error:", txError);
    
    // More specific error handling for transaction issues
    if (txError instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be used to identify the type of error
      if (txError.code === 'P2034') {
        return NextResponse.json(
          { error: "transaction timeout - the database is currently under high load, please try again" },
          { status: 408 }
        );
      } else if (txError.code === 'P2025') {
        return NextResponse.json(
          { error: "Record not found - the plot may have been booked by someone else" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Database transaction failed, please try again" },
      { status: 500 }
    );
  }
}

function calculateCommission(role: EmployeeRole, saleAmount: number) {
  // Define commission rates based on employee role
  const commissionRates: Record<EmployeeRole, number> = {
    FIELD_OFFICER: 0.10, // 10%
    JOINT_DIRECTOR: 0.15, // 15%
    DIRECTOR: 0.20, // 20%
    EXECUTIVE_DIRECTOR: 0.25, // 25%
  };

  const percentage = commissionRates[role];
  const amount = saleAmount * percentage;

  return {
    percentage,
    amount,
  };
}

/**
 * Get the team hierarchy for an employee
 */
async function getTeamHierarchy(employeeId: string): Promise<Record<EmployeeRole, string | null> | null> {
  try {
    // First get the employee's details
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) return null;

    const hierarchy: Record<EmployeeRole, string | null> = {
      FIELD_OFFICER: null,
      JOINT_DIRECTOR: null,
      DIRECTOR: null,
      EXECUTIVE_DIRECTOR: null
    };

    // Set the employee's role in the hierarchy
    hierarchy[employee.employeeRole] = employee.id;

    // If employee is already an EXECUTIVE_DIRECTOR, we're done
    if (employee.employeeRole === 'EXECUTIVE_DIRECTOR') {
      return hierarchy;
    }

    // Start with the current employee
    let currentEmployee = employee;
    
    // Traverse up the reporting chain until we reach the top or find all roles
    while (currentEmployee.reportsToId) {
      const supervisor = await db.employee.findUnique({
        where: { id: currentEmployee.reportsToId },
      });

      if (!supervisor) break;

      // Add this supervisor to the hierarchy
      hierarchy[supervisor.employeeRole] = supervisor.id;
      
      // If we've found the Executive Director, we can stop
      if (supervisor.employeeRole === 'EXECUTIVE_DIRECTOR') {
        break;
      }
      
      // Move up the chain
      currentEmployee = supervisor;
    }

    // If we still don't have an Executive Director, try to find one
    if (!hierarchy['EXECUTIVE_DIRECTOR']) {
      // Find the Executive Director (assuming there's only one or we want the first one)
      const executiveDirector = await db.employee.findFirst({
        where: { employeeRole: 'EXECUTIVE_DIRECTOR' },
      });

      if (executiveDirector) {
        hierarchy['EXECUTIVE_DIRECTOR'] = executiveDirector.id;
      }
    }

    console.log("Team hierarchy:", hierarchy);
    return hierarchy;
  } catch (error) {
    console.error("Error fetching team hierarchy:", error);
    return null;
  }
}

/**
 * Calculate commissions based on employee role and sale amount
 */
function calculateCommissions(
  role: EmployeeRole,
  employeeId: string,
  saleAmount: number,
  teamHierarchy: Record<EmployeeRole, string | null>
) {
  const commissions = [];
  
  // Base commission rates
  const baseRates: Record<EmployeeRole, number> = {
    FIELD_OFFICER: 0.10,    // 10%
    JOINT_DIRECTOR: 0.05,   // 5%
    DIRECTOR: 0.05,         // 5%
    EXECUTIVE_DIRECTOR: 0.05 // 5%
  };

  // Special rates when higher-level employees make the sale
  const specialRates: Partial<Record<EmployeeRole, number>> = {
    EXECUTIVE_DIRECTOR: 0.25, // 25%
    DIRECTOR: 0.20,          // 20%
    JOINT_DIRECTOR: 0.15     // 15%
  };

  console.log("Calculating commissions for role:", role);
  console.log("Team hierarchy:", teamHierarchy);

  // Define the role hierarchy in ascending order
  const roleHierarchy: EmployeeRole[] = ['FIELD_OFFICER', 'JOINT_DIRECTOR', 'DIRECTOR', 'EXECUTIVE_DIRECTOR'];
  const sellerRoleIndex = roleHierarchy.indexOf(role);

  if (role !== 'FIELD_OFFICER' && specialRates[role]) {
    // Higher-level employee making the sale - they get the special consolidated rate
    commissions.push({
      amount: saleAmount * specialRates[role]!,
      percentage: specialRates[role]!,
      employeeId,
      employeeRole: role,
      createdAt: new Date()
    });
    
    // Also give 5% to any roles above the seller
    for (let i = sellerRoleIndex + 1; i < roleHierarchy.length; i++) {
      const higherRole = roleHierarchy[i];
      const higherRoleEmployeeId = teamHierarchy[higherRole];
      
      if (higherRoleEmployeeId) {
        commissions.push({
          amount: saleAmount * baseRates[higherRole],
          percentage: baseRates[higherRole],
          employeeId: higherRoleEmployeeId,
          employeeRole: higherRole,
          createdAt: new Date()
        });
      }
    }
  } else {
    // Standard commission distribution for all roles
    // For each role in the hierarchy, add a commission if we have an employee for that role
    roleHierarchy.forEach(currentRole => {
      const percentage = baseRates[currentRole];
      const roleEmployeeId = teamHierarchy[currentRole];
      
      // Only create commission if we have an employee for this role
      if (roleEmployeeId) {
        commissions.push({
          amount: saleAmount * percentage,
          percentage,
          employeeId: roleEmployeeId,
          employeeRole: currentRole,
          createdAt: new Date()
        });
      }
    });
  }

  console.log("Calculated commissions:", commissions);
  return commissions;
} 