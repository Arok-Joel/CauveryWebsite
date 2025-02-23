import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";
import { CreateTeamDialog } from "@/components/admin/create-team-dialog";
import { AssignTeamMemberDialog } from "@/components/admin/assign-team-member-dialog";

type EmployeeWithUserAndTeams = Employee & {
  user: User;
  leadsTeam: { id: string; name: string } | null;
  memberOfTeam: { id: string; name: string } | null;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    orderBy: { employeeRole: "asc" },
    include: { 
      user: true,
      leadsTeam: {
        select: {
          id: true,
          name: true
        }
      },
      memberOfTeam: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return employees as EmployeeWithUserAndTeams[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const employees = await getEmployees();

  // Group employees by role
  const roleOrder = ["EXECUTIVE_DIRECTOR", "DIRECTOR", "JOINT_DIRECTOR", "FIELD_OFFICER"];
  const employeesByRole = roleOrder.reduce((acc, role) => {
    acc[role] = employees.filter(emp => emp.employeeRole === role);
    return acc;
  }, {} as Record<string, EmployeeWithUserAndTeams[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
        <CreateTeamDialog />
      </div>
      
      {roleOrder.map((role) => (
        <Card key={role}>
          <CardHeader>
            <CardTitle className="capitalize">
              {role.replace(/_/g, " ")}s ({employeesByRole[role]?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeesByRole[role]?.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{employee.user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{employee.user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{employee.user.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.leadsTeam ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 font-medium">
                              Team Leader of {employee.leadsTeam.name}
                            </span>
                            <AssignTeamMemberDialog
                              teamId={employee.leadsTeam.id}
                              teamName={employee.leadsTeam.name}
                            />
                          </div>
                        ) : employee.memberOfTeam ? (
                          <span className="text-blue-600 font-medium">
                            Member of {employee.memberOfTeam.name}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not in any team</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EmployeeRoleSelect
                          employeeId={employee.id}
                          currentRole={employee.employeeRole}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}