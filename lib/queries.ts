import { db } from "./db";
import { cache } from "react";

export const getTeamsWithDetails = cache(async () => {
  // Single query to get all teams with their leaders, members, and user details
  const teams = await db.team.findMany({
    include: {
      leader: {
        select: {
          id: true,
          employeeRole: true,
          hierarchyLevel: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      members: {
        select: {
          id: true,
          employeeRole: true,
          hierarchyLevel: true,
          reportsToId: true,
          user: {
            select: {
              name: true,
              email: true
            }
          },
          reportsTo: {
            select: {
              id: true,
              employeeRole: true,
              hierarchyLevel: true
            }
          }
        }
      }
    }
  });

  return teams;
});

export const getEmployeeHierarchy = cache(async () => {
  try {
    // Get all teams with their leaders and members in a single optimized query
    const teams = await db.team.findMany({
      include: {
        leader: {
          select: {
            id: true,
            employeeRole: true,
            hierarchyLevel: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        members: {
          select: {
            id: true,
            employeeRole: true,
            hierarchyLevel: true,
            reportsToId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            reportsTo: {
              select: {
                id: true
              }
            }
          },
          orderBy: [
            { hierarchyLevel: 'asc' },
            { user: { name: 'asc' } }
          ]
        }
      },
      orderBy: {
        leader: {
          hierarchyLevel: 'asc'
        }
      }
    });

    // Get unassigned employees in a separate query
    const unassignedEmployees = await db.employee.findMany({
      where: {
        AND: [
          { teamId: null },
          { leadsTeam: null }
        ]
      },
      select: {
        id: true,
        employeeRole: true,
        hierarchyLevel: true,
        reportsToId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { hierarchyLevel: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    // Track processed employee IDs to avoid duplication
    const processedEmployeeIds = new Set<string>();
    const processedTeams = [];

    // Process each team, but ensure each team is only represented once
    // and each Executive Director appears only once
    for (const team of teams) {
      // Skip teams we've already processed
      if (processedEmployeeIds.has(team.leader.id)) {
        continue;
      }

      // Mark the team leader as processed
      processedEmployeeIds.add(team.leader.id);

      // Filter team members to exclude those already processed
      // and exclude the leader who we'll handle separately
      const filteredMembers = team.members.filter(member => 
        !processedEmployeeIds.has(member.id) && member.id !== team.leader.id
      );

      // Mark all filtered members as processed
      filteredMembers.forEach(member => {
        processedEmployeeIds.add(member.id);
      });

      // Add this team with filtered members
      processedTeams.push({
        ...team,
        members: filteredMembers
      });
    }

    return { teams: processedTeams, unassignedEmployees };
  } catch (error) {
    console.error('Error fetching employee hierarchy:', error);
    throw error;
  }
});


export const getAvailableEmployees = cache(async () => {
  // Single query to get employees not in any team
  return db.employee.findMany({
    where: {
      AND: [
        { teamId: null },
        { leadsTeam: null }
      ]
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
});
