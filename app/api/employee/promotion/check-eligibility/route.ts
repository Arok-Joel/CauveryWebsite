import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { EmployeeRole } from '@prisma/client';
import { cookies } from 'next/headers';

// Function to get the next role in the hierarchy
function getNextRole(currentRole: EmployeeRole): EmployeeRole | null {
  const roleHierarchy = [
    EmployeeRole.FIELD_OFFICER,
    EmployeeRole.JOINT_DIRECTOR,
    EmployeeRole.DIRECTOR,
    EmployeeRole.EXECUTIVE_DIRECTOR,
  ];

  const currentIndex = roleHierarchy.indexOf(currentRole);
  
  // If at the top role or invalid role, there's no next role
  if (currentIndex === -1 || currentIndex === roleHierarchy.length - 1) {
    return null;
  }
  
  return roleHierarchy[currentIndex + 1];
}

// Function to check if an employee has eligible subordinates for promotion conditions
async function hasEligibleSubordinates(employeeId: string, role: EmployeeRole): Promise<boolean> {
  // This should check if the condition about having 2 field officers promoted applies
  // Note: This is specifically for the case where a Joint Director needs 2 field officers promoted
  if (role !== EmployeeRole.JOINT_DIRECTOR) {
    return false;
  }

  // Get subordinates that report to this employee
  const subordinates = await db.employee.findMany({
    where: {
      reportsToId: employeeId,
      employeeRole: EmployeeRole.FIELD_OFFICER
    }
  });

  // Edge case: If there are fewer than 2 field officers under them, this condition is nullified
  if (subordinates.length < 2) {
    return true; // Condition is nullified, so it's "met"
  }

  // If there are at least 2 subordinates, check promotion history
  // For this implementation, we'll count all field officers who have been promoted to joint directors
  const promotedSubordinates = await db.promotionRequest.count({
    where: {
      employeeId: {
        in: subordinates.map(sub => sub.id)
      },
      status: 'APPROVED',
      currentRole: EmployeeRole.FIELD_OFFICER,
      targetRole: EmployeeRole.JOINT_DIRECTOR
    }
  });

  return promotedSubordinates >= 2;
}

export async function GET() {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }
    
    const verified = await verifyAuth(token);
    
    if (!verified || verified.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the email from token - this is how we identify the user
    const email = verified.email;
    
    console.log('Verified token:', JSON.stringify(verified));
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Get employee details using email instead of ID
    const user = await db.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user || !user.employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const { employee } = user;
    const currentRole = employee.employeeRole;
    const nextRole = getNextRole(currentRole);

    // If already at the highest role, not eligible for promotion
    if (!nextRole) {
      return NextResponse.json({
        eligible: false,
        message: 'You are already at the highest role',
        role: currentRole,
      });
    }

    // Check for existing pending promotion request
    const existingRequest = await db.promotionRequest.findFirst({
      where: {
        employeeId: employee.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json({
        eligible: true,
        applied: true,
        message: 'You have already applied for promotion',
        role: currentRole,
        nextRole,
      });
    }

    // Check promotion criteria based on role
    let eligible = false;
    let conditionMet = '';
    let plotsRequired = 0;

    // Count sold plots
    const soldPlots = await db.commission.count({
      where: {
        employeeId: employee.id,
      },
    });

    switch (currentRole) {
      case EmployeeRole.FIELD_OFFICER:
        plotsRequired = 20;
        eligible = soldPlots >= plotsRequired;
        if (eligible) {
          conditionMet = `Sold ${soldPlots} plots (minimum ${plotsRequired} required)`;
        }
        break;

      case EmployeeRole.JOINT_DIRECTOR:
        plotsRequired = 50;
        const hasPromotedSubordinates = await hasEligibleSubordinates(employee.id, currentRole);
        
        if (soldPlots >= plotsRequired) {
          eligible = true;
          conditionMet = `Sold ${soldPlots} plots (minimum ${plotsRequired} required)`;
        } else if (hasPromotedSubordinates) {
          eligible = true;
          conditionMet = 'Has 2 promoted Field Officers OR condition nullified due to fewer than 2 Field Officers';
        }
        break;

      case EmployeeRole.DIRECTOR:
        plotsRequired = 100;
        eligible = soldPlots >= plotsRequired;
        if (eligible) {
          conditionMet = `Sold ${soldPlots} plots (minimum ${plotsRequired} required)`;
        }
        break;

      default:
        eligible = false;
    }

    return NextResponse.json({
      eligible,
      applied: false,
      message: eligible 
        ? 'You are eligible for promotion' 
        : `You need to meet promotion criteria: ${plotsRequired} plots sold`,
      role: currentRole,
      nextRole,
      plotsSold: soldPlots,
      plotsRequired,
      conditionMet: eligible ? conditionMet : '',
    });
    
  } catch (error) {
    console.error('Error checking promotion eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check promotion eligibility' },
      { status: 500 }
    );
  }
} 