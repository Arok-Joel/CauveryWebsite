import { db } from '@/lib/db';
import { EmployeeRole } from '@prisma/client';
import { ROLE_HIERARCHY_LEVELS, isRoleHigherThan } from './employee-roles';

interface ManagerCandidate {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  teamId: string | null;
  subordinateCount: number;
}

/**
 * Find potential managers for an employee based on hierarchy level
 * This allows flexible hierarchy where middle roles can be missing
 */
export async function findPotentialManagers(
  employeeId: string,
  teamId: string | null,
  filterSameRole = true
): Promise<ManagerCandidate[]> {
  try {
    // Get current employee details
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeRole: true,
        hierarchyLevel: true,
        teamId: true,
      }
    });

    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    // Find employees who can be managers based on hierarchy level
    // They should be in the same team (if team exists) and have a higher position (lower level number)
    const potentialManagers = await db.employee.findMany({
      where: {
        // Must have a lower hierarchy level number (higher position)
        hierarchyLevel: { lt: employee.hierarchyLevel },
        // Must not be the employee themself
        id: { not: employee.id },
        // Must be in same team if employee is in a team
        ...(employee.teamId ? { teamId: employee.teamId } : {}),
        // Optionally filter out same role (for cases where two employees have same role but different levels)
        ...(filterSameRole ? { employeeRole: { not: employee.employeeRole } } : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        subordinates: {
          select: { id: true }
        }
      },
      orderBy: [
        // Sort by hierarchy level (ascending - higher position first)
        { hierarchyLevel: 'asc' },
        // Secondary sort by number of subordinates (ascending - fewer subordinates first)
        { subordinates: { _count: 'asc' } }
      ]
    });

    // Format results
    return potentialManagers.map(manager => ({
      id: manager.id,
      name: manager.user.name,
      email: manager.user.email,
      role: manager.employeeRole,
      teamId: manager.teamId,
      subordinateCount: manager.subordinates.length
    }));
  } catch (error) {
    console.error('Error finding potential managers:', error);
    return [];
  }
}

/**
 * Find the most suitable manager for an employee based on hierarchy level
 * Returns the most suitable manager or null if none found
 */
export async function findMostSuitableManager(
  employeeId: string,
  teamId: string | null
): Promise<ManagerCandidate | null> {
  const managers = await findPotentialManagers(employeeId, teamId);
  
  if (managers.length === 0) {
    return null;
  }
  
  // Return the first manager as they're already sorted by hierarchy level and subordinate count
  return managers[0];
} 