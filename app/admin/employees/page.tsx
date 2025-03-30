import { getEmployeeHierarchy } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeNodeComponent } from '@/components/admin/employee-node';
import { EmployeeRole, User } from '@prisma/client';

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
