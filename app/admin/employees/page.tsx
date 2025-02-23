import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
  memberOfTeam: {
    id: string;
    leader: {
      id: string;
      user: {
        name: string;
      };
    };
  } | null;
  leadsTeam: {
    id: string;
  } | null;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    include: { 
      user: true,
      memberOfTeam: {
        select: {
          id: true,
          leader: {
            select: {
              id: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      leadsTeam: {
        select: {
          id: true
        }
      }
    }
  });
  return employees as EmployeeWithUserAndTeam[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const employees = await getEmployees();

  // First, group employees by team
  const employeesByTeam = employees.reduce((acc, employee) => {
    if (employee.leadsTeam) {
      // Create or get the team group
      if (!acc[employee.leadsTeam.id]) {
        acc[employee.leadsTeam.id] = {
          id: employee.leadsTeam.id,
          leader: employee,
          members: []
        };
      }
    } else if (employee.memberOfTeam) {
      // Add to existing team group
      if (!acc[employee.memberOfTeam.id]) {
        acc[employee.memberOfTeam.id] = {
          id: employee.memberOfTeam.id,
          leader: null,
          members: []
        };
      }
      acc[employee.memberOfTeam.id].members.push(employee);
    }
    return acc;
  }, {} as Record<string, { id: string; leader: EmployeeWithUserAndTeam | null; members: EmployeeWithUserAndTeam[] }>);

  // Get unassigned employees
  const unassignedEmployees = employees.filter(
    emp => !emp.leadsTeam && !emp.memberOfTeam
  );

  // Role order for sorting
  const roleOrder = {
    "EXECUTIVE_DIRECTOR": 0,
    "DIRECTOR": 1,
    "JOINT_DIRECTOR": 2,
    "FIELD_OFFICER": 3
  };

  // Sort unassigned employees by role
  const sortedUnassignedEmployees = unassignedEmployees.sort(
    (a, b) => roleOrder[a.employeeRole] - roleOrder[b.employeeRole]
  );

  // Sort team members by role
  Object.values(employeesByTeam).forEach(team => {
    team.members.sort((a, b) => roleOrder[a.employeeRole] - roleOrder[b.employeeRole]);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      <div className="space-y-2">
        {/* Teams with their hierarchies */}
        {Object.values(employeesByTeam).map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <CardContent className="p-0">
              {team.leader && (
                <div className="border-l-4 border-green-500 pl-6 py-3 bg-green-50/50">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className="absolute -left-[1.65rem] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-green-500"></span>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.leader.user.name}</p>
                        <p className="text-sm text-gray-500">{team.leader.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {team.leader.employeeRole.replace(/_/g, " ")}
                      </span>
                      <EmployeeRoleSelect
                        employeeId={team.leader.id}
                        currentRole={team.leader.employeeRole}
                      />
                    </div>
                  </div>
                </div>
              )}

              {team.members.map((member, index) => (
                <div 
                  key={member.id} 
                  className={`
                    border-l-4 border-blue-500 pl-6 py-3
                    ${index === team.members.length - 1 ? '' : 'border-b border-gray-100'}
                  `}
                >
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className="absolute -left-[1.65rem] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-blue-500"></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {member.employeeRole.replace(/_/g, " ")}
                      </span>
                      <EmployeeRoleSelect
                        employeeId={member.id}
                        currentRole={member.employeeRole}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Unassigned Employees */}
        {sortedUnassignedEmployees.length > 0 && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {sortedUnassignedEmployees.map((employee, index) => (
                <div 
                  key={employee.id} 
                  className={`
                    border-l-4 border-gray-300 pl-6 py-3
                    ${index === sortedUnassignedEmployees.length - 1 ? '' : 'border-b border-gray-100'}
                  `}
                >
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className="absolute -left-[1.65rem] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-gray-300"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employee.user.name}</p>
                        <p className="text-sm text-gray-500">{employee.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {employee.employeeRole.replace(/_/g, " ")}
                      </span>
                      <EmployeeRoleSelect
                        employeeId={employee.id}
                        currentRole={employee.employeeRole}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}