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
          },
        },
        reportsTo: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            reportsTo: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        subordinates: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            employeeRole: 'asc',
          },
        },
        memberOfTeam: {
          include: {
            leader: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            members: {
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
                }
              }
            }
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all direct reports (subordinates) IDs for deduplication
    const subordinateIds = new Set(employee.subordinates.map(sub => sub.id));

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

    // Format subordinates
    const directReports = employee.subordinates.map(sub => ({
      id: sub.id,
      name: sub.user.name,
      role: sub.employeeRole,
      email: sub.user.email,
    }));

    // Build the team hierarchy
    let teamHierarchy = null;
    
    if (employee.memberOfTeam) {
      // Get the team leader (Executive Director)
      const leader = employee.memberOfTeam.leader;
      
      if (leader) {
        // Create the team hierarchy starting with the leader
        teamHierarchy = {
          id: leader.id,
          name: leader.user.name,
          email: leader.user.email,
          role: leader.employeeRole,
          children: []
        };
        
        // Group team members by role
        const directors = employee.memberOfTeam.members.filter(m => 
          m.employeeRole === 'DIRECTOR' && m.id !== leader.id
        );
        
        const jointDirectors = employee.memberOfTeam.members.filter(m => 
          m.employeeRole === 'JOINT_DIRECTOR'
        );
        
        const fieldOfficers = employee.memberOfTeam.members.filter(m => 
          m.employeeRole === 'FIELD_OFFICER'
        );
        
        // Build director nodes
        const directorNodes = directors.map(director => {
          // Find joint directors reporting to this director
          const directorJDs = jointDirectors.filter(jd => 
            jd.reportsTo && jd.reportsTo.id === director.id
          );
          
          // Build joint director nodes
          const jdNodes = directorJDs.map(jd => {
            // Find field officers reporting to this joint director
            const jdFOs = fieldOfficers.filter(fo => 
              fo.reportsTo && fo.reportsTo.id === jd.id
            );
            
            // Build field officer nodes
            const foNodes = jdFOs.map(fo => ({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            }));
            
            return {
              id: jd.id,
              name: jd.user.name,
              email: jd.user.email,
              role: jd.employeeRole,
              children: foNodes
            };
          });
          
          return {
            id: director.id,
            name: director.user.name,
            email: director.user.email,
            role: director.employeeRole,
            children: jdNodes
          };
        });
        
        // Add directors as children of the team leader
        teamHierarchy.children = directorNodes;
      }
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