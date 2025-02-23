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
      // Create or update the team group
      acc[employee.leadsTeam.id] = {
        id: employee.leadsTeam.id,
        leader: employee,
        members: acc[employee.leadsTeam.id]?.members || []
      };
    } else if (employee.memberOfTeam) {
      // Add to existing team group or create new one preserving existing leader
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

  // Process teams to ensure all leaders are properly set
  const teamsWithLeaders = employees
    .filter(emp => emp.leadsTeam)
    .forEach(leader => {
      if (employeesByTeam[leader.leadsTeam!.id]) {
        employeesByTeam[leader.leadsTeam!.id].leader = leader;
      }
    });

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
          bg: "bg-emerald-50 hover:bg-emerald-100 transition-colors",
          border: "border-emerald-500",
          dot: "bg-emerald-500",
          badge: "bg-emerald-100 text-emerald-800"
        };
      case "DIRECTOR":
        return {
          bg: "bg-sky-50 hover:bg-sky-100 transition-colors",
          border: "border-sky-500",
          dot: "bg-sky-500",
          badge: "bg-sky-100 text-sky-800"
        };
      case "JOINT_DIRECTOR":
        return {
          bg: "bg-violet-50 hover:bg-violet-100 transition-colors",
          border: "border-violet-500",
          dot: "bg-violet-500",
          badge: "bg-violet-100 text-violet-800"
        };
      default:
        return {
          bg: "bg-slate-50 hover:bg-slate-100 transition-colors",
          border: "border-slate-300",
          dot: "bg-slate-400",
          badge: "bg-slate-100 text-slate-800"
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
                <div className="border-l-4 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.leader.user.name}</p>
                        <p className="text-sm text-gray-500">{team.leader.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
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

              {team.members.map((member) => {
                const styles = getRoleStyles(member.employeeRole);
                return (
                  <div 
                    key={member.id}
                    className={`border-l-4 ${styles.border} ${styles.bg}`}
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
              {sortedUnassignedEmployees.map((employee) => {
                const styles = getRoleStyles(employee.employeeRole);
                return (
                  <div 
                    key={employee.id}
                    className={`border-l-4 ${styles.border} ${styles.bg}`}
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