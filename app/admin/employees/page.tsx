import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User, Team, EmployeeRole } from "@prisma/client";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
  leadsTeam: Team | null;
  memberOfTeam: Team | null;
};

type RoleStyles = {
  bg: string;
  border: string;
  dot: string;
  badge: string;
};

type RoleOrder = {
  [K in EmployeeRole]: number;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    include: { 
      user: true,
      leadsTeam: true,
      memberOfTeam: true
    },
    orderBy: {
      employeeRole: 'asc'
    }
  });
  return employees as EmployeeWithUserAndTeam[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const employees = await getEmployees();

  // Role order for sorting and hierarchy
  const roleOrder: RoleOrder = {
    "EXECUTIVE_DIRECTOR": 0,
    "DIRECTOR": 1,
    "JOINT_DIRECTOR": 2,
    "FIELD_OFFICER": 3
  };

  // First, organize employees by their roles
  const employeesByRole = employees.reduce((acc, employee) => {
    const role = employee.employeeRole;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(employee);
    return acc;
  }, {} as Record<EmployeeRole, EmployeeWithUserAndTeam[]>);

  // Helper function to get role-based styles
  const getRoleStyles = (role: EmployeeRole): RoleStyles => {
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
        {/* Executive Directors and their teams */}
        {employeesByRole["EXECUTIVE_DIRECTOR"]?.map((executive) => {
          const styles = getRoleStyles(executive.employeeRole);
          return (
            <Card key={executive.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Executive Director */}
                <div className={`border-l-4 ${styles.border} ${styles.bg}`}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`}></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{executive.user.name}</p>
                        <p className="text-sm text-gray-500">{executive.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>
                        {executive.employeeRole.replace(/_/g, " ")}
                      </span>
                      <EmployeeRoleSelect
                        employeeId={executive.id}
                        currentRole={executive.employeeRole}
                      />
                    </div>
                  </div>
                </div>

                {/* Directors reporting to this Executive Director */}
                {employeesByRole["DIRECTOR"]?.filter(director => 
                  director.memberOfTeam?.id === executive.leadsTeam?.id
                ).map(director => {
                  const directorStyles = getRoleStyles(director.employeeRole);
                  return (
                    <div key={director.id} className="ml-6">
                      <div className={`border-l-4 ${directorStyles.border} ${directorStyles.bg}`}>
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <span className={`w-2 h-2 rounded-full ${directorStyles.dot}`}></span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{director.user.name}</p>
                              <p className="text-sm text-gray-500">{director.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${directorStyles.badge}`}>
                              {director.employeeRole.replace(/_/g, " ")}
                            </span>
                            <EmployeeRoleSelect
                              employeeId={director.id}
                              currentRole={director.employeeRole}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Joint Directors reporting to this Director */}
                      {employeesByRole["JOINT_DIRECTOR"]?.filter(jointDirector => 
                        jointDirector.memberOfTeam?.id === executive.leadsTeam?.id
                      ).map(jointDirector => {
                        const jointDirectorStyles = getRoleStyles(jointDirector.employeeRole);
                        return (
                          <div key={jointDirector.id} className="ml-6">
                            <div className={`border-l-4 ${jointDirectorStyles.border} ${jointDirectorStyles.bg}`}>
                              <div className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="relative">
                                    <span className={`w-2 h-2 rounded-full ${jointDirectorStyles.dot}`}></span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{jointDirector.user.name}</p>
                                    <p className="text-sm text-gray-500">{jointDirector.user.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${jointDirectorStyles.badge}`}>
                                    {jointDirector.employeeRole.replace(/_/g, " ")}
                                  </span>
                                  <EmployeeRoleSelect
                                    employeeId={jointDirector.id}
                                    currentRole={jointDirector.employeeRole}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Field Officers reporting to this Joint Director */}
                            {employeesByRole["FIELD_OFFICER"]?.filter(fieldOfficer => 
                              fieldOfficer.memberOfTeam?.id === executive.leadsTeam?.id
                            ).map(fieldOfficer => {
                              const fieldOfficerStyles = getRoleStyles(fieldOfficer.employeeRole);
                              return (
                                <div key={fieldOfficer.id} className="ml-6">
                                  <div className={`border-l-4 ${fieldOfficerStyles.border} ${fieldOfficerStyles.bg}`}>
                                    <div className="flex items-center justify-between p-4">
                                      <div className="flex items-center space-x-3">
                                        <div className="relative">
                                          <span className={`w-2 h-2 rounded-full ${fieldOfficerStyles.dot}`}></span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{fieldOfficer.user.name}</p>
                                          <p className="text-sm text-gray-500">{fieldOfficer.user.email}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${fieldOfficerStyles.badge}`}>
                                          {fieldOfficer.employeeRole.replace(/_/g, " ")}
                                        </span>
                                        <EmployeeRoleSelect
                                          employeeId={fieldOfficer.id}
                                          currentRole={fieldOfficer.employeeRole}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Unassigned Employees */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium">Unassigned Employees</h3>
            </div>
            {Object.entries(employeesByRole)
              .sort(([roleA], [roleB]) => roleOrder[roleA as keyof typeof roleOrder] - roleOrder[roleB as keyof typeof roleOrder])
              .map(([role, employees]) => 
                employees
                  .filter(emp => !emp.memberOfTeam && !emp.leadsTeam)
                  .map(employee => {
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
                  })
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}