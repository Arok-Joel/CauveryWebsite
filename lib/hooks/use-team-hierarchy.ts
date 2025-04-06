import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Employee, EmployeeRole } from '@prisma/client';

interface EmployeeWithUser extends Employee {
  user: {
    name: string;
    email: string;
  };
}

interface UseTeamHierarchyProps {
  employees: EmployeeWithUser[];
  onUpdateReporting?: (employeeId: string, managerId: string) => Promise<void>;
}

interface GroupedEmployees {
  [key: string]: EmployeeWithUser[];
}

export const useTeamHierarchy = ({ employees, onUpdateReporting }: UseTeamHierarchyProps) => {
  const [loading, setLoading] = useState(false);
  const [groupedByLevel, setGroupedByLevel] = useState<GroupedEmployees>({});
  const [groupedByRole, setGroupedByRole] = useState<GroupedEmployees>({});

  // Group employees by hierarchy level and role
  useEffect(() => {
    if (!employees || employees.length === 0) return;

    // Group by hierarchy level
    const byLevel: GroupedEmployees = {};
    // Group by role (for compatibility with existing code)
    const byRole: GroupedEmployees = {};

    employees.forEach(emp => {
      // Group by hierarchy level
      const level = String(emp.hierarchyLevel);
      if (!byLevel[level]) {
        byLevel[level] = [];
      }
      byLevel[level].push(emp);

      // Group by role
      if (!byRole[emp.employeeRole]) {
        byRole[emp.employeeRole] = [];
      }
      byRole[emp.employeeRole].push(emp);
    });

    setGroupedByLevel(byLevel);
    setGroupedByRole(byRole);
  }, [employees]);

  // Get potential managers for an employee based on hierarchy level
  const getPotentialManagers = useCallback((employee: EmployeeWithUser) => {
    if (!employee) return [];

    // Find employees with a lower hierarchy level (higher position)
    return employees.filter(emp => 
      emp.id !== employee.id && 
      emp.hierarchyLevel < employee.hierarchyLevel
    ).sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
  }, [employees]);

  // Update employee's reporting structure
  const updateReporting = useCallback(async (employeeId: string, managerId: string) => {
    if (!onUpdateReporting) return;

    setLoading(true);
    try {
      await onUpdateReporting(employeeId, managerId);
      toast.success('Reporting structure updated');
    } catch (error) {
      console.error('Error updating reporting structure:', error);
      toast.error('Failed to update reporting structure');
    } finally {
      setLoading(false);
    }
  }, [onUpdateReporting]);

  // Get direct reports for a manager based on the reporting relationships
  const getDirectReports = useCallback((managerId: string) => {
    return employees.filter(emp => emp.reportsToId === managerId);
  }, [employees]);

  // Check if an employee can report to a potential manager
  const canReportTo = useCallback((employee: EmployeeWithUser, manager: EmployeeWithUser) => {
    // Can report if manager has a lower hierarchy level number (higher position)
    return manager.hierarchyLevel < employee.hierarchyLevel;
  }, []);

  return {
    loading,
    groupedByLevel,
    groupedByRole,
    getPotentialManagers,
    updateReporting,
    getDirectReports,
    canReportTo
  };
}; 