import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendTerminationEmail } from '@/lib/email';

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    // Parse request body
    const body = await req.json();
    
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

    // Get employee details
    const employeeId = context.params.id;
    console.log('Terminating employee with ID:', employeeId);
    
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        subordinates: true,
        reportsTo: true,
        memberOfTeam: true,
        leadsTeam: {
          include: {
            members: true
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if employee is already terminated
    if (employee.isTerminated) {
      return NextResponse.json({ error: 'Employee is already terminated' }, { status: 400 });
    }

    // 1. Get the superior of the employee
    const superiorId = employee.reportsToId;

    // 2. If employee leads a team, handle team leadership transfer
    if (employee.leadsTeam) {
      // First remove team members' association
      if (employee.leadsTeam.members && employee.leadsTeam.members.length > 0) {
        console.log(`Updating ${employee.leadsTeam.members.length} team members to remove team association`);
        
        // Update all team members to no longer be part of the team
        await db.employee.updateMany({
          where: {
            teamId: employee.leadsTeam.id
          },
          data: {
            teamId: null
          }
        });
      }
      
      console.log(`Deleting team with ID: ${employee.leadsTeam.id}`);
      
      // Now it's safe to delete the team
      await db.team.delete({
        where: { id: employee.leadsTeam.id }
      });
    }

    // 3. Reassign all subordinates to report to the superior
    if (employee.subordinates.length > 0) {
      console.log(`Reassigning ${employee.subordinates.length} subordinates to report to ${superiorId || 'no one'}`);
      
      for (const subordinate of employee.subordinates) {
        await db.employee.update({
          where: { id: subordinate.id },
          data: { reportsToId: superiorId }
        });
      }
    }

    // 4. Update the employee record with termination status
    console.log('Updating employee termination status');
    
    const terminatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: {
        isTerminated: true,
        terminationDate: new Date(),
        reportsToId: null,
        teamId: null
      },
      include: {
        user: true
      }
    });

    // 5. Update the user status to prevent login
    console.log(`Updating user status for user ID: ${employee.userId}`);
    
    await db.user.update({
      where: { id: employee.userId },
      data: {
        status: 'INACTIVE'
      }
    });

    // 6. Send termination email
    try {
      console.log(`Sending termination email to: ${employee.user.email}`);
      
      await sendTerminationEmail({
        to: employee.user.email,
        employeeName: employee.user.name,
      });
      
      console.log('Termination email sent successfully');
    } catch (emailError) {
      console.log('Error sending termination email');
      // Continue with termination even if email sending fails
    }

    console.log('Employee termination completed successfully');
    
    return NextResponse.json({ 
      message: 'Employee terminated successfully',
      employeeId: terminatedEmployee.id
    });
  } catch (error) {
    // Handle error safely
    console.log('Error terminating employee');
    
    // Only log the error details if it's not null
    if (error) {
      console.log('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return NextResponse.json(
      { error: 'Failed to terminate employee' },
      { status: 500 }
    );
  }
} 