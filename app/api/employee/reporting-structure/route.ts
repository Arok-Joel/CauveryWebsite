import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { EmployeeRole } from '@prisma/client';
import { cookies } from 'next/headers';

// Define role hierarchy for validation
const roleHierarchy: Record<EmployeeRole, number> = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4,
};

// Define TeamMemberNode type for hierarchy
interface TeamMemberNode {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  children: TeamMemberNode[];
}

export async function GET() {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const verified = await verifyAuth(token);
    if (!verified || verified.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the employee with their reporting structure
    const employee = await db.employee.findFirst({
      where: {
        user: {
          email: verified.email,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        reportsTo: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            },
            reportsTo: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        subordinates: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        leadsTeam: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                },
                reportsTo: true
              }
            }
          }
        },
        memberOfTeam: {
          include: {
            leader: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                }
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                },
                reportsTo: true
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all direct reports (subordinates) IDs for deduplication
    const subordinateIds = new Set(employee.subordinates.map(sub => sub.id));
    
    // Collect unique direct reports
    const uniqueSubordinates = [...employee.subordinates];

    // Determine the manager based on reportsTo or team leader
    let manager = null;
    let managerOfManager = null;
    
    // First check if employee reports to someone
    if (employee.reportsTo) {
      manager = {
        id: employee.reportsTo.id,
        name: employee.reportsTo.user.name,
        role: employee.reportsTo.employeeRole,
        email: employee.reportsTo.user.email,
      };
      
      // Check if manager reports to someone
      if (employee.reportsTo.reportsTo) {
        managerOfManager = {
          id: employee.reportsTo.reportsTo.id,
          name: employee.reportsTo.reportsTo.user.name,
          role: employee.reportsTo.reportsTo.employeeRole,
          email: employee.reportsTo.reportsTo.user.email,
        };
      }
    } 
    // If no direct reporting relationship, check if part of a team
    else if (employee.memberOfTeam && employee.memberOfTeam.leader && employee.memberOfTeam.leader.id !== employee.id) {
      manager = {
        id: employee.memberOfTeam.leader.id,
        name: employee.memberOfTeam.leader.user.name,
        role: employee.memberOfTeam.leader.employeeRole,
        email: employee.memberOfTeam.leader.user.email,
        isTeamLead: true,
      };
    }

    // Format subordinates - ensuring no duplicates
    const directReports = uniqueSubordinates.map(sub => ({
      id: sub.id,
      name: sub.user.name,
      role: sub.employeeRole,
      email: sub.user.email,
    }));

    // Build the team hierarchy
    let teamHierarchy = null;

    // If employee is a team leader (Executive Director)
    if (employee.leadsTeam) {
      // Create the team hierarchy starting with the employee
      teamHierarchy = {
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.employeeRole,
        children: [] as TeamMemberNode[]
      };
      
      // Group team members by role
      const directors = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'DIRECTOR' && m.id !== employee.id
      );
      
      const jointDirectors = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'JOINT_DIRECTOR'
      );
      
      const fieldOfficers = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'FIELD_OFFICER'
      );

      // Add directors as direct children of the team leader
      directors.forEach(director => {
        const directorNode = {
          id: director.id,
          name: director.user.name,
          email: director.user.email,
          role: director.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Add joint directors that report to this director
        jointDirectors
          .filter(jd => jd.reportsToId === director.id)
          .forEach(jd => {
            const jdNode = {
              id: jd.id,
              name: jd.user.name,
              email: jd.user.email,
              role: jd.employeeRole,
              children: [] as TeamMemberNode[]
            };
            
            // Add field officers that report to this joint director
            fieldOfficers
              .filter(fo => fo.reportsToId === jd.id)
              .forEach(fo => {
                jdNode.children.push({
                  id: fo.id,
                  name: fo.user.name,
                  email: fo.user.email,
                  role: fo.employeeRole,
                  children: []
                });
              });
              
            directorNode.children.push(jdNode);
          });
          
        // Add field officers that report directly to this director
        fieldOfficers
          .filter(fo => fo.reportsToId === director.id)
          .forEach(fo => {
            directorNode.children.push({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
        teamHierarchy.children.push(directorNode);
      });
      
      // Add joint directors that report directly to the team leader
      jointDirectors
        .filter(jd => jd.reportsToId === employee.id)
        .forEach(jd => {
          const jdNode = {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Add field officers that report to this joint director
          fieldOfficers
            .filter(fo => fo.reportsToId === jd.id)
            .forEach(fo => {
              jdNode.children.push({
                id: fo.id,
                name: fo.user.name,
                email: fo.user.email,
                role: fo.employeeRole,
                children: []
              });
            });
            
          teamHierarchy.children.push(jdNode);
        });
        
      // Add field officers that report directly to the team leader
      fieldOfficers
        .filter(fo => fo.reportsToId === employee.id)
        .forEach(fo => {
          teamHierarchy.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
    }
    // If employee is a member of a team but not the leader
    else if (employee.memberOfTeam) {
      // Start with the team leader
      teamHierarchy = {
        id: employee.memberOfTeam.leader.id,
        name: employee.memberOfTeam.leader.user.name,
        email: employee.memberOfTeam.leader.user.email,
        role: employee.memberOfTeam.leader.employeeRole,
        children: [] as TeamMemberNode[]
      };
      
      // Group team members by role
      const directors = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'DIRECTOR' && m.id !== employee.memberOfTeam.leader.id
      );
      
      const jointDirectors = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'JOINT_DIRECTOR'
      );
      
      const fieldOfficers = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'FIELD_OFFICER'
      );
      
      // Add directors as direct children of the team leader
      directors.forEach(director => {
        const directorNode = {
          id: director.id,
          name: director.user.name,
          email: director.user.email,
          role: director.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Add joint directors that report to this director
        jointDirectors
          .filter(jd => jd.reportsToId === director.id)
          .forEach(jd => {
            const jdNode = {
              id: jd.id,
              name: jd.user.name,
              email: jd.user.email,
              role: jd.employeeRole,
              children: [] as TeamMemberNode[]
            };
            
            // Add field officers that report to this joint director
            fieldOfficers
              .filter(fo => fo.reportsToId === jd.id)
              .forEach(fo => {
                jdNode.children.push({
                  id: fo.id,
                  name: fo.user.name,
                  email: fo.user.email,
                  role: fo.employeeRole,
                  children: []
                });
              });
              
            directorNode.children.push(jdNode);
          });
          
        // Add field officers that report directly to this director
        fieldOfficers
          .filter(fo => fo.reportsToId === director.id)
          .forEach(fo => {
            directorNode.children.push({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
        teamHierarchy.children.push(directorNode);
      });
      
      // Add joint directors that report directly to the team leader
      jointDirectors
        .filter(jd => jd.reportsToId === employee.memberOfTeam.leader.id)
        .forEach(jd => {
          const jdNode = {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Add field officers that report to this joint director
          fieldOfficers
            .filter(fo => fo.reportsToId === jd.id)
            .forEach(fo => {
              jdNode.children.push({
                id: fo.id,
                name: fo.user.name,
                email: fo.user.email,
                role: fo.employeeRole,
                children: []
              });
            });
            
          teamHierarchy.children.push(jdNode);
        });
        
      // Add field officers that report directly to the team leader
      fieldOfficers
        .filter(fo => fo.reportsToId === employee.memberOfTeam.leader.id)
        .forEach(fo => {
          teamHierarchy.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
    }

    // Format response to match the expected ReportingStructure interface
    const reportingStructure = {
      self: {
        id: employee.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.employeeRole,
      },
      manager,
      managerOfManager,
      directReports,
      teamHierarchy
    };

    return NextResponse.json({ reportingStructure });
  } catch (error) {
    console.error('Error fetching reporting structure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 