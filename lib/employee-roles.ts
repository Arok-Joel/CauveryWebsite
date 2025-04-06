import { EmployeeRole } from '@prisma/client';

// Define the mapping between roles and hierarchy levels
export const ROLE_HIERARCHY_LEVELS: Record<EmployeeRole, number> = {
  EXECUTIVE_DIRECTOR: 0,  // Top level - lowest number
  DIRECTOR: 1,
  JOINT_DIRECTOR: 2,
  FIELD_OFFICER: 3,       // Bottom level - highest number
};

// Define the hierarchy order of roles from top to bottom
export const ROLE_HIERARCHY_ORDER: EmployeeRole[] = [
  EmployeeRole.EXECUTIVE_DIRECTOR,
  EmployeeRole.DIRECTOR,
  EmployeeRole.JOINT_DIRECTOR, 
  EmployeeRole.FIELD_OFFICER,
];

/**
 * Gets the hierarchy level for a given role
 */
export function getHierarchyLevelForRole(role: EmployeeRole): number {
  return ROLE_HIERARCHY_LEVELS[role];
}

/**
 * Gets the next role in the hierarchy (for promotions)
 */
export function getNextRoleInHierarchy(currentRole: EmployeeRole): EmployeeRole | null {
  const currentIndex = ROLE_HIERARCHY_ORDER.indexOf(currentRole);
  
  // If at the top role or invalid role, there's no next role
  if (currentIndex <= 0 || currentIndex === -1) {
    return null;
  }
  
  return ROLE_HIERARCHY_ORDER[currentIndex - 1]; // Move up in hierarchy (lower index)
}

/**
 * Gets the previous role in the hierarchy
 */
export function getPreviousRoleInHierarchy(currentRole: EmployeeRole): EmployeeRole | null {
  const currentIndex = ROLE_HIERARCHY_ORDER.indexOf(currentRole);
  
  // If at the bottom role or invalid role, there's no previous role
  if (currentIndex === -1 || currentIndex >= ROLE_HIERARCHY_ORDER.length - 1) {
    return null;
  }
  
  return ROLE_HIERARCHY_ORDER[currentIndex + 1]; // Move down in hierarchy (higher index)
}

/**
 * Gets all roles at a specific hierarchy level or below/above
 */
export function getRolesAtOrAboveLevel(level: number): EmployeeRole[] {
  return Object.entries(ROLE_HIERARCHY_LEVELS)
    .filter(([_, roleLevel]) => roleLevel <= level)
    .map(([role]) => role as EmployeeRole);
}

export function getRolesAtOrBelowLevel(level: number): EmployeeRole[] {
  return Object.entries(ROLE_HIERARCHY_LEVELS)
    .filter(([_, roleLevel]) => roleLevel >= level)
    .map(([role]) => role as EmployeeRole);
}

/**
 * Checks if one role is higher in the hierarchy than another
 */
export function isRoleHigherThan(role1: EmployeeRole, role2: EmployeeRole): boolean {
  return ROLE_HIERARCHY_LEVELS[role1] < ROLE_HIERARCHY_LEVELS[role2];
}

/**
 * Finds suitable manager roles for a given role
 * (typically roles that are one level above)
 */
export function getSuitableManagerRolesFor(role: EmployeeRole): EmployeeRole[] {
  const roleLevel = ROLE_HIERARCHY_LEVELS[role];
  
  // Get roles that are exactly one level above
  return Object.entries(ROLE_HIERARCHY_LEVELS)
    .filter(([_, level]) => level === roleLevel - 1)
    .map(([roleKey]) => roleKey as EmployeeRole);
}

/**
 * Format role name for display
 */
export function formatRoleName(role: EmployeeRole): string {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
} 