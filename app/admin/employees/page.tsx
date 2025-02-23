import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";

type EmployeeWithRelations = Employee & {
  user: User;
  subordinates: (Employee & {
    user: User;
    subordinates: (Employee & {
      user: User;
      subordinates: (Employee & {
        user: User;
      })[];
    })[];
  })[];
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    where: {
      employeeRole: "EXECUTIVE_DIRECTOR",
      reportsToId: null
    },
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
  });
  return employees as EmployeeWithRelations[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const executives = await getEmployees();

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

  // Component to render an employee with their subordinates
  const EmployeeNode = ({ 
    employee, 
    level = 0,
    isLast = false,
    parentLines = []
  }: { 
    employee: EmployeeWithRelations, 
    level?: number,
    isLast?: boolean,
    parentLines?: boolean[]
  }) => {
    const styles = getRoleStyles(employee.employeeRole);
    const hasSubordinates = employee.subordinates.length > 0;

    return (
      <div className="relative">
        <div className="relative flex">
          {/* Vertical lines from parent */}
          {parentLines.map((showLine, index) => (
            <div
              key={index}
              className={`absolute w-px bg-gray-200 ${showLine ? "" : "invisible"}`}
              style={{
                left: `${index * 24}px`,
                top: 0,
                bottom: 0,
              }}
            />
          ))}
          
          {/* Horizontal line to current node */}
          {level > 0 && (
            <div className="absolute h-px bg-gray-200" style={{
              left: `${(level - 1) * 24}px`,
              width: "24px",
              top: "50%"
            }} />
          )}

          {/* Employee card */}
          <div
            className={`relative flex-1 border-l-4 ${styles.border} ${styles.bg}`}
            style={{ marginLeft: `${level * 24}px` }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
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
        </div>

        {/* Render subordinates */}
        {hasSubordinates && (
          <div className="ml-6">
            {employee.subordinates.map((subordinate, index) => (
              <EmployeeNode
                key={subordinate.id}
                employee={subordinate}
                level={level + 1}
                isLast={index === employee.subordinates.length - 1}
                parentLines={[...parentLines, !isLast]}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      <div className="space-y-6">
        {executives.map((executive, index) => (
          <Card key={executive.id} className="overflow-hidden">
            <CardContent className="p-6">
              <EmployeeNode 
                employee={executive}
                isLast={index === executives.length - 1}
                parentLines={[]}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}