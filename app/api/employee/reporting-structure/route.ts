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
    
    // Handle specific case for Executive Directors
    if (employee.employeeRole === 'EXECUTIVE_DIRECTOR') {
      // If the employee is a Executive Director team leader, they don't have a manager
      if (employee.leadsTeam) {
        manager = null;
      }
      // If they're an Executive Director but not the team leader, manager is team leader
      else if (employee.memberOfTeam && employee.memberOfTeam.leader && 
               employee.memberOfTeam.leader.id !== employee.id) {
        manager = {
          id: employee.memberOfTeam.leader.id,
          name: employee.memberOfTeam.leader.user.name,
          role: employee.memberOfTeam.leader.employeeRole,
          email: employee.memberOfTeam.leader.user.email,
          isTeamLead: true
        };
      }
      // Keep existing reporting relationship from database if it exists
      else if (employee.reportsTo) {
        manager = {
          id: employee.reportsTo.id,
          name: employee.reportsTo.user.name,
          role: employee.reportsTo.employeeRole,
          email: employee.reportsTo.user.email
        };
      }
    }
    // For other roles, use standard reporting structure
    else {
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
    }

    // Format subordinates - ensuring no duplicates
    const directReports = uniqueSubordinates.map(sub => ({
      id: sub.id,
      name: sub.user.name,
      role: sub.employeeRole,
      email: sub.user.email,
    }));

    // Build the team hierarchy
    let teamHierarchy: TeamMemberNode | null = null;

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
      const executives = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'EXECUTIVE_DIRECTOR' && m.id !== employee.id
      );
      
      const directors = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'DIRECTOR'
      );
      
      const jointDirectors = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'JOINT_DIRECTOR'
      );
      
      const fieldOfficers = employee.leadsTeam.members.filter(m => 
        m.employeeRole === 'FIELD_OFFICER'
      );

      // Add other executive directors first (if any)
      executives.forEach(exec => {
        const execNode = {
          id: exec.id,
          name: exec.user.name,
          email: exec.user.email,
          role: exec.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Find directors reporting to this executive
        const execDirectors = directors.filter(d => d.reportsToId === exec.id);
        execDirectors.forEach(dir => {
          const dirNode = {
            id: dir.id,
            name: dir.user.name,
            email: dir.user.email,
            role: dir.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Find joint directors reporting to this director
          const dirJointDirectors = jointDirectors.filter(jd => jd.reportsToId === dir.id);
          dirJointDirectors.forEach(jd => {
            const jdNode = {
              id: jd.id,
              name: jd.user.name,
              email: jd.user.email,
              role: jd.employeeRole,
              children: [] as TeamMemberNode[]
            };
            
            // Find field officers reporting to this joint director
            const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
            jdFieldOfficers.forEach(fo => {
              jdNode.children.push({
                id: fo.id,
                name: fo.user.name,
                email: fo.user.email,
                role: fo.employeeRole,
                children: []
              });
            });
            
            dirNode.children.push(jdNode);
          });
          
          // Find field officers reporting directly to this director (not to joint directors)
          const dirFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === dir.id);
          dirFieldOfficers.forEach(fo => {
            dirNode.children.push({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
          execNode.children.push(dirNode);
        });
        
        // Find joint directors reporting directly to this executive (not to directors)
        const execJointDirectors = jointDirectors.filter(jd => jd.reportsToId === exec.id);
        execJointDirectors.forEach(jd => {
          const jdNode = {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Find field officers reporting to this joint director
          const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
          jdFieldOfficers.forEach(fo => {
            jdNode.children.push({
              id: fo.id,
              name: fo.user.name, 
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
          execNode.children.push(jdNode);
        });
        
        // Find field officers reporting directly to this executive (not to directors or joint directors)
        const execFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === exec.id);
        execFieldOfficers.forEach(fo => {
          execNode.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
        
        if (teamHierarchy) {
          teamHierarchy.children.push(execNode);
        }
      });
      
      // Add directors reporting directly to team leader
      const leaderDirectors = directors.filter(d => d.reportsToId === employee.id);
      leaderDirectors.forEach(dir => {
        const dirNode = {
          id: dir.id,
          name: dir.user.name,
          email: dir.user.email,
          role: dir.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Find joint directors reporting to this director
        const dirJointDirectors = jointDirectors.filter(jd => jd.reportsToId === dir.id);
        dirJointDirectors.forEach(jd => {
          const jdNode = {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Find field officers reporting to this joint director
          const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
          jdFieldOfficers.forEach(fo => {
            jdNode.children.push({
              id: fo.id,
              name: fo.user.name, 
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
          dirNode.children.push(jdNode);
        });
        
        // Find field officers reporting directly to this director
        const dirFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === dir.id);
        dirFieldOfficers.forEach(fo => {
          dirNode.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
        
        if (teamHierarchy) {
          teamHierarchy.children.push(dirNode);
        }
      });
      
      // Add joint directors reporting directly to team leader
      const leaderJointDirectors = jointDirectors.filter(jd => jd.reportsToId === employee.id);
      leaderJointDirectors.forEach(jd => {
        const jdNode = {
          id: jd.id,
          name: jd.user.name,
          email: jd.user.email,
          role: jd.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Find field officers reporting to this joint director
        const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
        jdFieldOfficers.forEach(fo => {
          jdNode.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
        
        if (teamHierarchy) {
          teamHierarchy.children.push(jdNode);
        }
      });
      
      // Add field officers reporting directly to team leader
      const leaderFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === employee.id);
      leaderFieldOfficers.forEach(fo => {
        if (teamHierarchy) {
          teamHierarchy.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        }
      });
    }
    // If employee is a member of a team but not the leader
    else if (employee.memberOfTeam && employee.memberOfTeam.leader) {
      // Create the team hierarchy starting with the team leader
      teamHierarchy = {
        id: employee.memberOfTeam.leader.id,
        name: employee.memberOfTeam.leader.user.name,
        email: employee.memberOfTeam.leader.user.email,
        role: employee.memberOfTeam.leader.employeeRole,
        children: [] as TeamMemberNode[]
      };
      
      // Group team members by role for proper hierarchy
      const executives = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'EXECUTIVE_DIRECTOR' && m.id !== employee.memberOfTeam?.leader.id
      );
      
      const directors = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'DIRECTOR'
      );
      
      const jointDirectors = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'JOINT_DIRECTOR'
      );
      
      const fieldOfficers = employee.memberOfTeam.members.filter(m => 
        m.employeeRole === 'FIELD_OFFICER'
      );
      
      // Add all executives under the team leader
      executives.forEach(exec => {
        const execNode = {
          id: exec.id,
          name: exec.user.name,
          email: exec.user.email,
          role: exec.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Find directors reporting to this executive
        const execDirectors = directors.filter(d => d.reportsToId === exec.id);
        execDirectors.forEach(dir => {
          const dirNode = {
            id: dir.id,
            name: dir.user.name,
            email: dir.user.email,
            role: dir.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Find joint directors reporting to this director
          const dirJointDirectors = jointDirectors.filter(jd => jd.reportsToId === dir.id);
          dirJointDirectors.forEach(jd => {
            const jdNode = {
              id: jd.id,
              name: jd.user.name,
              email: jd.user.email,
              role: jd.employeeRole,
              children: [] as TeamMemberNode[]
            };
            
            // Find field officers reporting to this joint director
            const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
            jdFieldOfficers.forEach(fo => {
              jdNode.children.push({
                id: fo.id,
                name: fo.user.name,
                email: fo.user.email,
                role: fo.employeeRole,
                children: []
              });
            });
            
            dirNode.children.push(jdNode);
          });
          
          // Find field officers reporting directly to this director
          const dirFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === dir.id);
          dirFieldOfficers.forEach(fo => {
            dirNode.children.push({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
          execNode.children.push(dirNode);
        });
        
        // Find joint directors reporting directly to this executive
        const execJointDirectors = jointDirectors.filter(jd => jd.reportsToId === exec.id);
        execJointDirectors.forEach(jd => {
          const jdNode = {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Find field officers reporting to this joint director
          const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
          jdFieldOfficers.forEach(fo => {
            jdNode.children.push({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
          execNode.children.push(jdNode);
        });
        
        // Find field officers reporting directly to this executive
        const execFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === exec.id);
        execFieldOfficers.forEach(fo => {
          execNode.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
        
        if (teamHierarchy) {
          teamHierarchy.children.push(execNode);
        }
      });
      
      // Add directors reporting directly to team leader
      const leaderDirectors = directors.filter(d => d.reportsToId === employee.memberOfTeam?.leader.id);
      leaderDirectors.forEach(dir => {
        const dirNode = {
          id: dir.id,
          name: dir.user.name,
          email: dir.user.email,
          role: dir.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Find joint directors reporting to this director
        const dirJointDirectors = jointDirectors.filter(jd => jd.reportsToId === dir.id);
        dirJointDirectors.forEach(jd => {
          const jdNode = {
            id: jd.id,
            name: jd.user.name,
            email: jd.user.email,
            role: jd.employeeRole,
            children: [] as TeamMemberNode[]
          };
          
          // Find field officers reporting to this joint director
          const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
          jdFieldOfficers.forEach(fo => {
            jdNode.children.push({
              id: fo.id,
              name: fo.user.name,
              email: fo.user.email,
              role: fo.employeeRole,
              children: []
            });
          });
          
          dirNode.children.push(jdNode);
        });
        
        // Find field officers reporting directly to this director
        const dirFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === dir.id);
        dirFieldOfficers.forEach(fo => {
          dirNode.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
        
        if (teamHierarchy) {
          teamHierarchy.children.push(dirNode);
        }
      });
      
      // Add joint directors reporting directly to team leader
      const leaderJointDirectors = jointDirectors.filter(jd => jd.reportsToId === employee.memberOfTeam?.leader.id);
      leaderJointDirectors.forEach(jd => {
        const jdNode = {
          id: jd.id,
          name: jd.user.name,
          email: jd.user.email,
          role: jd.employeeRole,
          children: [] as TeamMemberNode[]
        };
        
        // Find field officers reporting to this joint director
        const jdFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === jd.id);
        jdFieldOfficers.forEach(fo => {
          jdNode.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        });
        
        if (teamHierarchy) {
          teamHierarchy.children.push(jdNode);
        }
      });
      
      // Add field officers reporting directly to team leader
      const leaderFieldOfficers = fieldOfficers.filter(fo => fo.reportsToId === employee.memberOfTeam?.leader.id);
      leaderFieldOfficers.forEach(fo => {
        if (teamHierarchy) {
          teamHierarchy.children.push({
            id: fo.id,
            name: fo.user.name,
            email: fo.user.email,
            role: fo.employeeRole,
            children: []
          });
        }
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