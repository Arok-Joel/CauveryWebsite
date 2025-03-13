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
      
      // Build joint director nodes
      const jdNodes = directors.flatMap(director => {
        const directorJDs = jointDirectors.filter(jd => 
          jd.reportsTo && jd.reportsTo.id === director.id
        );
        
        return directorJDs.map(jd => {
          const jdFOs = fieldOfficers.filter(fo => 
            fo.reportsTo && fo.reportsTo.id === jd.id
          );
          
          // Build field officer nodes
          const foNodes = jdFOs.map(fo => ({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: [] as TeamMemberNode[]
          })) as TeamMemberNode[];
          
          return {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: foNodes
          } as TeamMemberNode;
        });
      }) as TeamMemberNode[];
      
      // Build director nodes
      const directorNodes = directors.map(director => {
        // Get joint directors that report to this director
        const directorJointDirectors = jdNodes.filter(jd => {
          // Find the original joint director object to check the reporting relationship
          const originalJd = jointDirectors.find(original => original.id === jd.id);
          return originalJd && originalJd.reportsTo && originalJd.reportsTo.id === director.id;
        });
        
        return {
          id: director.id,
          name: director.user.name,
          email: director.user.email,
          role: director.employeeRole,
          children: directorJointDirectors
        } as TeamMemberNode;
      }) as TeamMemberNode[];
      
      // Add directors as children of the team leader
      teamHierarchy.children = directorNodes as TeamMemberNode[];
    }
    // If not a team leader but part of a team
    else if (employee.memberOfTeam) {
      // Get the team leader (Executive Director)
      const leader = employee.memberOfTeam.leader;
      
      if (leader) {
        // Create the team hierarchy starting with the leader
        teamHierarchy = {
          id: leader.id,
          name: leader.user.name,
          email: leader.user.email,
          role: leader.employeeRole,
          children: [] as TeamMemberNode[]
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
        
        // Use the same logic to build the hierarchy
        // Build joint director nodes
        const jdNodes = directors.flatMap(director => {
          const directorJDs = jointDirectors.filter(jd => 
            jd.reportsTo && jd.reportsTo.id === director.id
          );
          
          return directorJDs.map(jd => {
            const jdFOs = fieldOfficers.filter(fo => 
              fo.reportsTo && fo.reportsTo.id === jd.id
            );
            
            // Build field officer nodes
            const foNodes = jdFOs.map(fo => ({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: [] as TeamMemberNode[]
            })) as TeamMemberNode[];
            
            return {
              id: jd.id,
              name: jd.user.name,
              email: jd.user.email,
              role: jd.employeeRole,
              children: foNodes
            } as TeamMemberNode;
          });
        }) as TeamMemberNode[];
        
        // Build director nodes
        const directorNodes = directors.map(director => {
          // Get joint directors that report to this director
          const directorJointDirectors = jdNodes.filter(jd => {
            // Find the original joint director object to check the reporting relationship
            const originalJd = jointDirectors.find(original => original.id === jd.id);
            return originalJd && originalJd.reportsTo && originalJd.reportsTo.id === director.id;
          });
          
          return {
            id: director.id,
            name: director.user.name,
            email: director.user.email,
            role: director.employeeRole,
            children: directorJointDirectors
          } as TeamMemberNode;
        }) as TeamMemberNode[];
        
        // Add directors as children of the team leader
        teamHierarchy.children = directorNodes as TeamMemberNode[];
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