import { db } from "./db";
import { EmployeeRole } from "@prisma/client";

// Define the mapping between roles and hierarchy levels
const ROLE_HIERARCHY_LEVELS: Record<EmployeeRole, number> = {
  EXECUTIVE_DIRECTOR: 0,  // Top level - lowest number
  DIRECTOR: 1,
  JOINT_DIRECTOR: 2,
  FIELD_OFFICER: 3,       // Bottom level - highest number
};

/**
 * Updates the hierarchy level for all employees based on their roles
 * This is a utility function that can be called to ensure all employees have the correct hierarchy levels
 * It's useful for fixing data issues or when adding the hierarchy level to an existing system
 */
export async function updateAllEmployeeHierarchyLevels() {
  try {
    console.log('Starting to update hierarchy levels for all employees...');
    
    // Get all employees
    const employees = await db.employee.findMany({
      select: {
        id: true,
        employeeRole: true,
        hierarchyLevel: true,
      }
    });
    
    console.log(`Found ${employees.length} employees to process`);
    
    // Count of employees updated
    let updatedCount = 0;
    
    // Update each employee's hierarchy level based on their role
    for (const employee of employees) {
      // Get the correct hierarchy level for this role
      const correctLevel = ROLE_HIERARCHY_LEVELS[employee.employeeRole];
      
      // If the current level is different or not set, update it
      if (employee.hierarchyLevel !== correctLevel) {
        await db.employee.update({
          where: { id: employee.id },
          data: { hierarchyLevel: correctLevel }
        });
        
        updatedCount++;
        console.log(`Updated employee ${employee.id} (${employee.employeeRole}): ${employee.hierarchyLevel} → ${correctLevel}`);
      }
    }
    
    console.log(`Completed hierarchy level update. ${updatedCount} employees were updated.`);
    return { success: true, updatedCount, totalCount: employees.length };
    
  } catch (error) {
    console.error('Error updating employee hierarchy levels:', error);
    return { success: false, error };
  }
}

/**
 * Updates a single employee's hierarchy level based on their role
 */
export async function updateEmployeeHierarchyLevel(employeeId: string) {
  try {
    // Get the employee
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeRole: true,
        hierarchyLevel: true,
      }
    });
    
    if (!employee) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    
    // Get the correct hierarchy level for this role
    const correctLevel = ROLE_HIERARCHY_LEVELS[employee.employeeRole];
    
    // If the current level is different or not set, update it
    if (employee.hierarchyLevel !== correctLevel) {
      await db.employee.update({
        where: { id: employee.id },
        data: { hierarchyLevel: correctLevel }
      });
      
      console.log(`Updated employee ${employee.id} (${employee.employeeRole}): ${employee.hierarchyLevel} → ${correctLevel}`);
      return { success: true, updated: true, previous: employee.hierarchyLevel, current: correctLevel };
    }
    
    return { success: true, updated: false, current: employee.hierarchyLevel };
    
  } catch (error) {
    console.error(`Error updating hierarchy level for employee ${employeeId}:`, error);
    return { success: false, error };
  }
} 