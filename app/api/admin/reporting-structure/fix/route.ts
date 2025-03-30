import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { EmployeeRole } from '@prisma/client';

// Admin-only endpoint to fix reporting structure issues after role changes
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

    // Get all teams with their members
    const teams = await db.team.findMany({
      include: {
        leader: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    const updates = [];

    // Process each team to fix reporting structure
    for (const team of teams) {
      // Group employees by role
      const employeesByRole = {
        EXECUTIVE_DIRECTOR: team.members.filter(e => e.employeeRole === EmployeeRole.EXECUTIVE_DIRECTOR),
        DIRECTOR: team.members.filter(e => e.employeeRole === EmployeeRole.DIRECTOR),
        JOINT_DIRECTOR: team.members.filter(e => e.employeeRole === EmployeeRole.JOINT_DIRECTOR),
        FIELD_OFFICER: team.members.filter(e => e.employeeRole === EmployeeRole.FIELD_OFFICER),
      };

      // Fix 1: Ensure the team leader is an Executive Director
      if (team.leader.employeeRole !== EmployeeRole.EXECUTIVE_DIRECTOR) {
        const executiveDirector = employeesByRole.EXECUTIVE_DIRECTOR[0];
        if (executiveDirector) {
          await db.team.update({
            where: { id: team.id },
            data: { leaderId: executiveDirector.id },
          });
          updates.push(`Set team ${team.id} leader to ${executiveDirector.user.name}`);
        }
      }

      // Fix 2: Directors should report to the Executive Director
      const executiveDirectorId = employeesByRole.EXECUTIVE_DIRECTOR[0]?.id;
      if (executiveDirectorId) {
        for (const director of employeesByRole.DIRECTOR) {
          if (director.reportsToId !== executiveDirectorId) {
            await db.employee.update({
              where: { id: director.id },
              data: { reportsToId: executiveDirectorId },
            });
            updates.push(`Updated Director ${director.user.name} to report to Executive Director`);
          }
        }
      }

      // Fix 3: Joint Directors should report to Directors
      for (const jointDirector of employeesByRole.JOINT_DIRECTOR) {
        const isReportingToDirector = employeesByRole.DIRECTOR.some(
          d => d.id === jointDirector.reportsToId
        );

        if (!isReportingToDirector && employeesByRole.DIRECTOR.length > 0) {
          // Assign to a Director (simple round-robin assignment)
          const directorIndex = employeesByRole.JOINT_DIRECTOR.indexOf(jointDirector) % employeesByRole.DIRECTOR.length;
          const directorId = employeesByRole.DIRECTOR[directorIndex].id;
          
          await db.employee.update({
            where: { id: jointDirector.id },
            data: { reportsToId: directorId },
          });
          updates.push(`Updated Joint Director ${jointDirector.user.name} to report to a Director`);
        }
      }

      // Fix 4: Field Officers should report to Joint Directors
      for (const fieldOfficer of employeesByRole.FIELD_OFFICER) {
        const isReportingToJointDirector = employeesByRole.JOINT_DIRECTOR.some(
          jd => jd.id === fieldOfficer.reportsToId
        );

        if (!isReportingToJointDirector && employeesByRole.JOINT_DIRECTOR.length > 0) {
          // Assign to a Joint Director (simple round-robin assignment)
          const jdIndex = employeesByRole.FIELD_OFFICER.indexOf(fieldOfficer) % employeesByRole.JOINT_DIRECTOR.length;
          const jointDirectorId = employeesByRole.JOINT_DIRECTOR[jdIndex].id;
          
          await db.employee.update({
            where: { id: fieldOfficer.id },
            data: { reportsToId: jointDirectorId },
          });
          updates.push(`Updated Field Officer ${fieldOfficer.user.name} to report to a Joint Director`);
        }
      }
    }

    return NextResponse.json({
      message: 'Reporting structures fixed successfully',
      updates,
    });
    
  } catch (error) {
    console.error('Error fixing reporting structures:', error);
    return NextResponse.json(
      { error: 'Failed to fix reporting structures' },
      { status: 500 }
    );
  }
} 