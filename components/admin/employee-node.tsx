"use client";

import { useRouter } from 'next/navigation';
import { EmployeeRole } from '@prisma/client';
import { EmployeeRoleSelect } from '@/components/admin/employee-role-select';
import { User } from '@prisma/client';

interface EmployeeNode {
  id: string;
  user: User;
  employeeRole: EmployeeRole;
  reportsTo?: string | null;
  children: EmployeeNode[];
}

const roleOrder = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4,
} as const;

function getRoleStyles(role: EmployeeRole) {
  switch (role) {
    case 'EXECUTIVE_DIRECTOR':
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        badge: 'bg-emerald-100 text-emerald-800',
        border: 'border-emerald-500',
        dot: 'bg-emerald-500',
      };

    case 'DIRECTOR':
      return {
        bg: 'bg-sky-50 hover:bg-sky-100',
        badge: 'bg-sky-100 text-sky-800',
        border: 'border-sky-500',
        dot: 'bg-sky-500',
      };

    case 'JOINT_DIRECTOR':
      return {
        bg: 'bg-violet-50 hover:bg-violet-100',
        badge: 'bg-violet-100 text-violet-800',
        border: 'border-violet-500',
        dot: 'bg-violet-500',
      };

    default:
      return {
        bg: 'bg-slate-50 hover:bg-slate-100',
        badge: 'bg-slate-100 text-slate-800',
        border: 'border-slate-500',
        dot: 'bg-slate-500',
      };
  }
}

export function EmployeeNodeComponent({
  employee,
  level = 0,
  showTeamBadge = false,
  parentId = '',
}: {
  employee: EmployeeNode;
  level?: number;
  showTeamBadge?: boolean;
  parentId?: string;
}) {
  const styles = getRoleStyles(employee.employeeRole);
  const router = useRouter();

  // Create a unique key for this instance of the employee
  const nodeKey = parentId ? `${employee.id}-child-of-${parentId}` : employee.id;

  const handleClick = () => {
    console.log('Navigating to employee:', employee.id);
    try {
      // Use window.location for direct navigation as a fallback
      window.location.href = `/admin/employees/${employee.id}`;
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div
      className="relative"
      style={{
        marginLeft: `${level * 2}rem`,
        marginBottom: '0.5rem',
      }}
    >
      {level > 0 && (
        <>
          {/* Vertical line */}
          <div
            className="absolute border-l-2 border-gray-200"
            style={{
              left: '-1rem',
              top: '-0.5rem',
              height: 'calc(100% + 1rem)',
            }}
          />

          {/* Horizontal line */}
          <div
            className="absolute border-t-2 border-gray-200"
            style={{
              left: '-1rem',
              width: '1rem',
              top: '1.5rem',
            }}
          />
        </>
      )}

      <div 
        className={`${styles.bg} rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{employee.user.name}</p>
            <p className="text-sm text-gray-500">{employee.user.email}</p>
          </div>

          <div className="flex items-center space-x-2">
            {showTeamBadge && employee.employeeRole === 'EXECUTIVE_DIRECTOR' && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Team Leader
              </span>
            )}

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
            >
              {employee.employeeRole.replace(/_/g, ' ')}
            </span>

            <EmployeeRoleSelect employeeId={employee.id} currentRole={employee.employeeRole} />
          </div>
        </div>
      </div>

      {/* Render children */}
      {employee.children.length > 0 && (
        <div className="mt-2">
          {employee.children
            .sort((a, b) => roleOrder[a.employeeRole] - roleOrder[b.employeeRole])
            .map((child, index) => (
              <EmployeeNodeComponent 
                key={`${child.id}-child-of-${employee.id}-${index}`}
                employee={child} 
                level={level + 1}
                parentId={employee.id}
              />
            ))}
        </div>
      )}
    </div>
  );
} 