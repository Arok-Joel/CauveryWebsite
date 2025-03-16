import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EmployeeRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
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
        !facing || !employeeId || !customerName || !phoneNumber || !email || 
        !address || !aadhaarNumber) {
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

    // Get employee details to determine role
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Fetch team hierarchy
    const teamHierarchy = await getTeamHierarchy(employeeId);

    if (!teamHierarchy) {
      return NextResponse.json(
        { error: "Failed to fetch team hierarchy" },
        { status: 500 }
      );
    }

    // Calculate commissions based on employee role
    const saleAmount = parseFloat(price);
    const commissions = calculateCommissions(employee.employeeRole, employeeId, saleAmount, teamHierarchy);

    // Start a transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Create the sold plot record
      const soldPlot = await tx.soldPlot.create({
        data: {
          plotNumber,
          size,
          plotAddress,
          price,
          dimensions,
          facing,
          employeeName: employeeId,
          customerName,
          phoneNumber,
          email,
          address,
          aadhaarNumber,
          plotId,
        },
      });

      // Update the plot status to "sold"
      const updatedPlot = await tx.plot.update({
        where: { id: plotId },
        data: { status: "sold" },
      });

      // Create commission records
      const commissionRecords = await Promise.all(
        commissions.map(commission =>
          tx.commission.create({
            data: {
              amount: commission.amount,
              percentage: commission.percentage,
              employeeId: commission.employeeId,
              employeeRole: commission.employeeRole,
              soldPlotId: soldPlot.id,
            }
          })
        )
      );

      return { soldPlot, updatedPlot, commissions: commissionRecords };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error booking plot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to book plot" },
      { status: 500 }
    );
  }
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

  if (role !== 'FIELD_OFFICER' && specialRates[role]) {
    // Higher-level employee making the sale - they get the special consolidated rate
    commissions.push({
      amount: saleAmount * specialRates[role]!,
      percentage: specialRates[role]!,
      employeeId,
      employeeRole: role,
      createdAt: new Date()
    });
  } else {
    // Standard commission distribution for all roles
    // Define the role hierarchy in ascending order
    const roleHierarchy: EmployeeRole[] = ['FIELD_OFFICER', 'JOINT_DIRECTOR', 'DIRECTOR', 'EXECUTIVE_DIRECTOR'];
    
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