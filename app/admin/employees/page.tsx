import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User, Team, EmployeeRole } from "@prisma/client";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
  employeeRole: EmployeeRole;
  reportsTo?: string | null;
  children: EmployeeNode[];
}

const roleOrder = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4
} as const;

async function getEmployees() {
  try {
    // Get all teams with their leaders and members
    const teams = await db.team.findMany({
      include: {
        leader: {
          include: {
            user: true
          }
        },
        members: {
          include: {
            user: true,
            reportsTo: {
              select: {
                id: true,
                employeeRole: true
              }
            }
          }
        }
      }
    });

    // Get all employees who are not in any team
    const unassignedEmployees = await db.employee.findMany({
      where: {
        AND: [
          { teamId: null },
          { leadsTeam: null }
        ]
      },
      include: {
        user: true,
        reportsTo: {
          select: {
            id: true,
            employeeRole: true
          }
        }
      }
    });

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
          children: []
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
        children: directors
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
      children: []
    }));

    // Sort unassigned by role first, then name
    unassigned.sort((a, b) => {
      const roleDiff = roleOrder[a.employeeRole] - roleOrder[b.employeeRole];
      return roleDiff !== 0 ? roleDiff : a.user.name.localeCompare(b.user.name);
    });

    return { executives, unassigned };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { executives: [], unassigned: [] };
  }
}

function EmployeeNodeComponent({ 
  employee, 
  level = 0,
  showTeamBadge = false
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
        marginBottom: "0.5rem"
      }}
    >
      {level > 0 && (
        <>
          {/* Vertical line */}
          <div 
            className="absolute border-l-2 border-gray-200"
            style={{ 
              left: "-1rem",
              top: "-0.5rem",
              height: "calc(100% + 1rem)"
            }}
          />
          {/* Horizontal line */}
          <div 
            className="absolute border-t-2 border-gray-200"
            style={{ 
              left: "-1rem",
              width: "1rem",
              top: "1.5rem"
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
            {showTeamBadge && employee.employeeRole === "EXECUTIVE_DIRECTOR" && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Team Leader
              </span>
            )}
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

      {/* Render children */}
      {employee.children.length > 0 && (
        <div className="mt-2">
          {employee.children
            .sort((a, b) => roleOrder[a.employeeRole] - roleOrder[b.employeeRole])
            .map((child) => (
              <EmployeeNodeComponent 
                key={child.id} 
                employee={child}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

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