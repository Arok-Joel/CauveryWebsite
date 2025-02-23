import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
  memberOfTeam: {
    id: string;
    name: string;
    leader: {
      id: string;
      user: {
        name: string;
      };
    };
  } | null;
  leadsTeam: {
    id: string;
    name: string;
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
          name: true,
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
          id: true,
          name: true
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
          name: employee.leadsTeam.name,
          leader: employee,
          members: []
        };
      }
    } else if (employee.memberOfTeam) {
      // Add to existing team group
      if (!acc[employee.memberOfTeam.id]) {
        acc[employee.memberOfTeam.id] = {
          id: employee.memberOfTeam.id,
          name: employee.memberOfTeam.name,
          leader: null,
          members: []
        };
      }
      acc[employee.memberOfTeam.id].members.push(employee);
    }
    return acc;
  }, {} as Record<string, { id: string; name: string; leader: EmployeeWithUserAndTeam | null; members: EmployeeWithUserAndTeam[] }>);

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

      {/* Teams */}
      {Object.values(employeesByTeam).map((team) => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Team Leader */}
              {team.leader && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Team Leader</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.leader.user.name}</p>
                        <p className="text-sm text-gray-500">{team.leader.user.email}</p>
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
                </div>
              )}

              {/* Team Members */}
              {team.members.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Team Members</h3>
                  <div className="space-y-3">
                    {team.members.map((member) => (
                      <div key={member.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                            <p className="text-sm text-gray-500">{member.user.email}</p>
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
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Unassigned Employees */}
      {sortedUnassignedEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Unassigned Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedUnassignedEmployees.map((employee) => (
                <div key={employee.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{employee.user.name}</p>
                      <p className="text-sm text-gray-500">{employee.user.email}</p>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}