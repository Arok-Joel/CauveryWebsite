import { getEmployeeHierarchy } from '@/lib/queries';

import { EmployeeRoleSelect } from '@/components/admin/employee-role-select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Employee, User, EmployeeRole } from '@prisma/client';

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

async function getEmployees() {
  try {
    const { teams, unassignedEmployees } = await getEmployeeHierarchy();

    // Create nodes for team leaders (executives)

    const executives = teams.map(team => {
      // First, organize team members by role

      const directors: EmployeeNode[] = [];

      const jointDirectors: EmployeeNode[] = [];

      const fieldOfficers: EmployeeNode[] = [];

      team.members.forEach(member => {
        const node: EmployeeNode = {
          id: member.id,

          user: member.user,

          employeeRole: member.employeeRole,

          reportsTo: member.reportsTo?.id,

          children: [],
        };

        switch (member.employeeRole) {
          case 'DIRECTOR':
            directors.push(node);

            break;

          case 'JOINT_DIRECTOR':
            jointDirectors.push(node);

            break;

          case 'FIELD_OFFICER':
            fieldOfficers.push(node);

            break;
        }
      });

      // Build the hierarchy

      // Field Officers report to Joint Directors

      fieldOfficers.forEach(fo => {
        const reportingJD = jointDirectors.find(jd => fo.reportsTo === jd.id);

        if (reportingJD) {
          reportingJD.children.push(fo);
        }
      });

      // Joint Directors report to Directors

      jointDirectors.forEach(jd => {
        const reportingDirector = directors.find(d => jd.reportsTo === d.id);

        if (reportingDirector) {
          reportingDirector.children.push(jd);
        }
      });

      // Directors report to Executive Director

      return {
        id: team.leader.id,

        user: team.leader.user,

        employeeRole: team.leader.employeeRole,

        children: directors,
      };
    });

    // Sort all levels by name

    const sortByName = (a: EmployeeNode, b: EmployeeNode) => a.user.name.localeCompare(b.user.name);

    executives.sort(sortByName);

    executives.forEach(exec => {
      exec.children.sort(sortByName);

      exec.children.forEach(director => {
        director.children.sort(sortByName);

        director.children.forEach(jd => {
          jd.children.sort(sortByName);
        });
      });
    });

    // Create nodes for unassigned employees

    const unassigned = unassignedEmployees.map(emp => ({
      id: emp.id,

      user: emp.user,

      employeeRole: emp.employeeRole,

      reportsTo: emp.reportsTo?.id,

      children: [],
    }));

    // Sort unassigned by role first, then name

    unassigned.sort((a, b) => {
      const roleDiff = roleOrder[a.employeeRole] - roleOrder[b.employeeRole];

      return roleDiff !== 0 ? roleDiff : a.user.name.localeCompare(b.user.name);
    });

    return { executives, unassigned };
  } catch (error) {
    console.error('Error fetching employees:', error);

    return { executives: [], unassigned: [] };
  }
}

function EmployeeNodeComponent({
  employee,

  level = 0,

  showTeamBadge = false,
}: {
  employee: EmployeeNode;

  level?: number;

  showTeamBadge?: boolean;
}) {
  const styles = getRoleStyles(employee.employeeRole);

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

      <div className={`${styles.bg} rounded-lg p-4`}>
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

            .map(child => (
              <EmployeeNodeComponent key={child.id} employee={child} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get role-based styles

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

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export default async function EmployeesPage() {
  const { executives, unassigned } = await getEmployees();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      {/* Executive Directors Section */}

      <Card>
        <CardHeader>
          <CardTitle>Executive Directors & Their Teams</CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-8">
            {executives.map(executive => (
              <EmployeeNodeComponent key={executive.id} employee={executive} showTeamBadge={true} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Employees Section */}

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Employees</CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              {unassigned.map(employee => (
                <EmployeeNodeComponent key={employee.id} employee={employee} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
