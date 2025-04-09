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

    return { teams, unassignedEmployees };
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
