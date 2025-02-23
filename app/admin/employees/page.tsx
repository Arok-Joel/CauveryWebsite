import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    members: {
      id: string;
      employeeRole: string;
      user: User;
      reportsToId: string | null;
    }[];
  } | null;
  reportsTo: Employee | null;
  subordinates: (Employee & {
    user: User;
    subordinates: (Employee & {
      user: User;
    })[];
  })[];
};

async function getEmployees() {
  const employees = await db.employee.findMany({
    include: {
      user: true,
      memberOfTeam: {
        include: {
          leader: {
            include: {
              user: true
            }
          }
        }
      },
      leadsTeam: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      },
      reportsTo: true,
      subordinates: {
        include: {
          user: true,
          subordinates: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  // Separate employees into team leaders and unassigned
  const teamLeaders = employees.filter(e => e.leadsTeam);
  const unassigned = employees.filter(e => !e.memberOfTeam && !e.leadsTeam);

  // Build hierarchy for each team
  const buildHierarchy = (leader: EmployeeWithUserAndTeam) => {
    const findSubordinates = (managerId: string): EmployeeWithUserAndTeam[] => {
      return employees
        .filter(e => e.reportsToId === managerId)
        .map(subordinate => ({
          ...subordinate,
          subordinates: findSubordinates(subordinate.id)
        })) as EmployeeWithUserAndTeam[];
    };

    return {
      ...leader,
      subordinates: findSubordinates(leader.id)
    };
  };

  const hierarchicalTeams = teamLeaders.map(buildHierarchy);

  return { teamLeaders: hierarchicalTeams, unassigned };
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function EmployeeNode({ 
  employee, 
  level = 0,
  showTeamBadge = false
}: { 
  employee: EmployeeWithUserAndTeam, 
  level?: number,
  showTeamBadge?: boolean
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
            {showTeamBadge && employee.leadsTeam && (
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

      {/* Render subordinates */}
      {employee.subordinates?.length > 0 && (
        <div className="mt-2">
          {employee.subordinates.map((subordinate) => (
            <EmployeeNode 
              key={subordinate.id} 
              employee={subordinate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get role-based styles
function getRoleStyles(role: string) {
  switch (role) {
    case "EXECUTIVE_DIRECTOR":
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100",
        badge: "bg-emerald-100 text-emerald-800"
      };
    case "DIRECTOR":
      return {
        bg: "bg-sky-50 hover:bg-sky-100",
        badge: "bg-sky-100 text-sky-800"
      };
    case "JOINT_DIRECTOR":
      return {
        bg: "bg-violet-50 hover:bg-violet-100",
        badge: "bg-violet-100 text-violet-800"
      };
    default:
      return {
        bg: "bg-slate-50 hover:bg-slate-100",
        badge: "bg-slate-100 text-slate-800"
      };
  }
}

export default async function EmployeesPage() {
  const { teamLeaders, unassigned } = await getEmployees();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      {/* Teams Section */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {teamLeaders.map((leader) => (
              <EmployeeNode 
                key={leader.id} 
                employee={leader}
                showTeamBadge={true}
              />
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
              {unassigned.map((employee) => (
                <EmployeeNode 
                  key={employee.id} 
                  employee={employee}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}