import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, User, EmployeeRole } from "@prisma/client";

interface EmployeeWithRelations extends Employee {
  user: User;
  subordinates: EmployeeWithRelations[];
}

interface EmployeeNode {
  id: string;
  user: User;
  employeeRole: EmployeeRole;
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
    // Get all teams with their complete hierarchy
    const teams = await db.team.findMany({
      include: {
        leader: {
          include: {
            user: true,
            subordinates: {
              include: {
                user: true,
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
            }
          }
        }
      }
    });

    // Get unassigned employees (those not in any team)
    const unassignedEmployees = await db.employee.findMany({
      where: {
        AND: [
          { teamId: null },
          { leadsTeam: null }
        ]
      },
      include: {
        user: true
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    // Convert the flat structure into a hierarchical tree
    function buildHierarchyTree(employee: EmployeeWithRelations): EmployeeNode {
      const node: EmployeeNode = {
        id: employee.id,
        user: employee.user,
        employeeRole: employee.employeeRole,
        children: []
      };

      // Filter and sort subordinates based on role
      if (employee.subordinates) {
        if (employee.employeeRole === "EXECUTIVE_DIRECTOR") {
          // Executive Director should only show Directors
          node.children = employee.subordinates
            .filter(sub => sub.employeeRole === "DIRECTOR")
            .sort((a, b) => a.user.name.localeCompare(b.user.name))
            .map(buildHierarchyTree);
        } else if (employee.employeeRole === "DIRECTOR") {
          // Directors should only show Joint Directors
          node.children = employee.subordinates
            .filter(sub => sub.employeeRole === "JOINT_DIRECTOR")
            .sort((a, b) => a.user.name.localeCompare(b.user.name))
            .map(buildHierarchyTree);
        } else if (employee.employeeRole === "JOINT_DIRECTOR") {
          // Joint Directors should only show Field Officers
          node.children = employee.subordinates
            .filter(sub => sub.employeeRole === "FIELD_OFFICER")
            .sort((a, b) => a.user.name.localeCompare(b.user.name))
            .map(buildHierarchyTree);
        }
      }

      return node;
    }

    // Create hierarchy trees for each team
    const executives = teams.map(team => buildHierarchyTree(team.leader as EmployeeWithRelations));

    // Create nodes for unassigned employees
    const unassigned = unassignedEmployees.map(emp => ({
      id: emp.id,
      user: emp.user,
      employeeRole: emp.employeeRole,
      children: []
    }));

    return { executives, unassigned };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { executives: [], unassigned: [] };
  }
}

function EmployeeNodeComponent({ 
  employee, 
  level = 0
}: { 
  employee: EmployeeNode;
  level?: number;
}) {
  const styles = getRoleStyles(employee.employeeRole);
  const indentSize = level * 2.5;

  return (
    <div 
      className="relative"
      style={{ 
        marginLeft: `${indentSize}rem`,
        marginBottom: "1rem"
      }}
    >
      {level > 0 && (
        <>
          {/* Vertical line */}
          <div 
            className="absolute border-l-2 border-gray-200"
            style={{ 
              left: "-1.25rem",
              top: "-0.5rem",
              height: "calc(100% + 1rem)"
            }}
          />
          {/* Horizontal line */}
          <div 
            className="absolute border-t-2 border-gray-200"
            style={{ 
              left: "-1.25rem",
              width: "1.25rem",
              top: "1.5rem"
            }}
          />
        </>
      )}

      <div className={`${styles.bg} rounded-lg p-4 border border-gray-100 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{employee.user.name}</p>
            <p className="text-sm text-gray-500">{employee.user.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            {level === 0 && (
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

      {employee.children.length > 0 && (
        <div className="mt-4">
          {employee.children.map((child) => (
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

function getRoleStyles(role: EmployeeRole) {
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
    case "FIELD_OFFICER":
      return {
        bg: "bg-slate-50 hover:bg-slate-100",
        badge: "bg-slate-100 text-slate-800"
      };
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const { executives, unassigned } = await getEmployees();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      {/* Teams Section */}
      <Card>
        <CardHeader>
          <CardTitle>Teams & Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {executives.map((executive) => (
              <EmployeeNodeComponent 
                key={executive.id} 
                employee={executive}
              />
            ))}
            {executives.length === 0 && (
              <p className="text-sm text-gray-500 text-center">No teams configured yet</p>
            )}
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
                <EmployeeNodeComponent 
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