import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User, Team } from "@prisma/client";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
  leadsTeam: Team | null;
  memberOfTeam: Team | null;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    include: { 
      user: true,
      leadsTeam: true,
      memberOfTeam: true
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

  // Helper function to get role-based styles
  const getRoleStyles = (role: string) => {
    switch (role) {
      case "EXECUTIVE_DIRECTOR":
        return {
          bg: "bg-green-50",
          border: "border-green-500",
          dot: "bg-green-500",
          badge: "bg-green-100 text-green-800"
        };
      case "DIRECTOR":
        return {
          bg: "bg-blue-50",
          border: "border-blue-500",
          dot: "bg-blue-500",
          badge: "bg-blue-100 text-blue-800"
        };
      case "JOINT_DIRECTOR":
        return {
          bg: "bg-purple-50",
          border: "border-purple-500",
          dot: "bg-purple-500",
          badge: "bg-purple-100 text-purple-800"
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-300",
          dot: "bg-gray-400",
          badge: "bg-gray-100 text-gray-800"
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      <div className="space-y-6">
        {/* Teams */}
        {Object.values(employeesByTeam).map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <CardContent className="p-0">
              {team.leader && (
                <div className="border-l-4 border-green-500 bg-green-50">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.leader.user.name}</p>
                        <p className="text-sm text-gray-500">{team.leader.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
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

              {team.members.map((member, index) => {
                const styles = getRoleStyles(member.employeeRole);
                return (
                  <div 
                    key={member.id}
                    className={`border-l-4 ${styles.border} ${styles.bg} ${
                      index !== team.members.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>
                          {member.employeeRole.replace(/_/g, " ")}
                        </span>
                        <EmployeeRoleSelect
                          employeeId={member.id}
                          currentRole={member.employeeRole}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Unassigned Employees */}
        {sortedUnassignedEmployees.length > 0 && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {sortedUnassignedEmployees.map((employee, index) => {
                const styles = getRoleStyles(employee.employeeRole);
                return (
                  <div 
                    key={employee.id}
                    className={`border-l-4 ${styles.border} ${styles.bg} ${
                      index !== sortedUnassignedEmployees.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{employee.user.name}</p>
                          <p className="text-sm text-gray-500">{employee.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>
                          {employee.employeeRole.replace(/_/g, " ")}
                        </span>
                        <EmployeeRoleSelect
                          employeeId={employee.id}
                          currentRole={employee.employeeRole}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}