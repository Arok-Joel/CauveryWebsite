import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as z from 'zod';

// Validate the promotion processing request
const processSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Parse request body
    const body = await req.json();
    const { status } = processSchema.parse(body);

    // Fetch the promotion request
    const promotionRequest = await db.promotionRequest.findUnique({
      where: { id },
    });

    if (!promotionRequest) {
      return NextResponse.json(
        { error: 'Promotion request not found' },
        { status: 404 }
      );
    }

    if (promotionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This promotion request has already been processed' },
        { status: 400 }
      );
    }

    // Get the employee details with their current manager
    const employee = await db.employee.findUnique({
      where: { id: promotionRequest.employeeId },
      include: {
        reportsTo: true,
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Process the request in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the promotion request status
      const updatedRequest = await tx.promotionRequest.update({
        where: { id },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedById: null,
        },
      });

      // If approved, update the employee's role and reporting structure
      if (status === 'APPROVED') {
        let newReportsToId = null;
        
        // Handle updating reporting structure based on role changes
        if (employee.employeeRole === 'FIELD_OFFICER' && promotionRequest.targetRole === 'JOINT_DIRECTOR') {
          // Scenario: Field Officer -> Joint Director
          // New Joint Director should report to the same Director that their previous manager (Joint Director) reported to
          if (employee.reportsTo) {
            // Get their current manager's manager (who should be a Director)
            const currentManagersManager = await tx.employee.findUnique({
              where: { id: employee.reportsTo.reportsToId || '' },
              select: { id: true, employeeRole: true }
            });
            
            if (currentManagersManager && currentManagersManager.employeeRole === 'DIRECTOR') {
              newReportsToId = currentManagersManager.id;
            } else {
              // Fallback: find a Director in the same team
              const director = await tx.employee.findFirst({
                where: { 
                  teamId: employee.teamId,
                  employeeRole: 'DIRECTOR' 
                }
              });
              
              if (director) {
                newReportsToId = director.id;
              }
            }
          }
          
          // Now any field officers reporting to this employee should continue to report to them
          // No changes needed for their subordinates
        } 
        else if (employee.employeeRole === 'JOINT_DIRECTOR' && promotionRequest.targetRole === 'DIRECTOR') {
          // Scenario: Joint Director -> Director
          // New Director should report to the Executive Director
          const executiveDirector = await tx.employee.findFirst({
            where: { 
              teamId: employee.teamId,
              employeeRole: 'EXECUTIVE_DIRECTOR' 
            }
          });
          
          if (executiveDirector) {
            newReportsToId = executiveDirector.id;
          }
          
          // Joint Directors who reported to this employee's manager should now report to this employee
          // Find Joint Directors who reported to the same Director
          if (employee.reportsToId) {
            await tx.employee.updateMany({
              where: {
                reportsToId: employee.reportsToId,
                id: { not: employee.id },
                employeeRole: 'JOINT_DIRECTOR'
              },
              data: {
                reportsToId: employee.id
              }
            });
          }
        }
        else if (employee.employeeRole === 'DIRECTOR' && promotionRequest.targetRole === 'EXECUTIVE_DIRECTOR') {
          // Scenario: Director -> Executive Director
          // Top of hierarchy - no manager needed
          newReportsToId = null;
          
          // Should be assigned as leader of the team
          if (employee.teamId) {
            await tx.team.update({
              where: { id: employee.teamId },
              data: { leaderId: employee.id }
            });
          }
        }

        // Update the employee's role and reporting relationship
        const updatedEmployee = await tx.employee.update({
          where: { id: employee.id },
          data: {
            employeeRole: promotionRequest.targetRole,
            reportsToId: newReportsToId,
          },
        });
        
        return { updatedRequest, updatedEmployee };
      }
      
      return { updatedRequest };
    });

    // Return success response
    return NextResponse.json({
      message: `Promotion request ${status.toLowerCase()}`,
      promotionRequest: result.updatedRequest,
    });
    
  } catch (error) {
    console.error('Error processing promotion request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process promotion request' },
      { status: 500 }
    );
  }
} 