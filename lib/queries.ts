import { db } from "./db";
import { cache } from "react";

export const getTeamsWithDetails = cache(async () => {
  // Single query to get all teams with their leaders, members, and user details
  const teams = await db.team.findMany({
    include: {
      leader: {
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      members: {
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          reportsTo: {
            select: {
              id: true,
              employeeRole: true
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
    // Get all teams with their leaders and members
    const teams = await db.team.findMany({
      include: {
        leader: {
          include: {
            user: true
          }
        },
        members: {
          include: {
            user: true,
            reportsTo: {
              select: {
                id: true,
                employeeRole: true
              }
            }
          }
        }
      }
    });

    // Get all employees who are not in any team
    const unassignedEmployees = await db.employee.findMany({
      where: {
        AND: [
          { teamId: null },
          { leadsTeam: null }
        ]
      },
      include: {
        user: true,
        reportsTo: {
          select: {
            id: true,
            employeeRole: true
          }
        }
      }
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
