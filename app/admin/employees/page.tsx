import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";

type EmployeeWithUserAndReports = Employee & {
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

async function getEmployees() {
  // Get top-level employees (those who don't report to anyone)
  const employees = await db.employee.findMany({
    where: {
      reportsToId: null,
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
    },
    orderBy: {
      dateOfJoining: 'asc'
    }
  });

  return employees;
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

function EmployeeNode({ 
  employee, 
  level = 0 
}: { 
  employee: EmployeeWithUserAndReports, 
  level?: number 
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
  const employees = await getEmployees();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {employees.map((employee) => (
              <EmployeeNode key={employee.id} employee={employee} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}