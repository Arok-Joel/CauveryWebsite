import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";
import { ChevronDown, ChevronRight } from "lucide-react";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    include: { 
      user: true
    },
    orderBy: [
      { employeeRole: 'asc' },
      { dateOfJoining: 'desc' }
    ]
  });
  return employees as EmployeeWithUserAndTeam[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const employees = await getEmployees();

  // Role order for sorting and grouping
  const roleOrder = {
    "EXECUTIVE_DIRECTOR": 0,
    "DIRECTOR": 1,
    "JOINT_DIRECTOR": 2,
    "FIELD_OFFICER": 3
  };

  // Sort employees by role
  const sortedEmployees = [...employees].sort(
    (a, b) => roleOrder[a.employeeRole] - roleOrder[b.employeeRole]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          {sortedEmployees.map((employee, index) => {
            const isExecutiveDirector = employee.employeeRole === "EXECUTIVE_DIRECTOR";
            const borderColor = isExecutiveDirector ? "border-green-500" : "border-gray-200";
            const bgColor = isExecutiveDirector ? "bg-green-50" : "bg-white";
            const dotColor = isExecutiveDirector ? "bg-green-500" : "bg-gray-400";
            const badgeColor = isExecutiveDirector 
              ? "bg-green-100 text-green-800" 
              : employee.employeeRole === "DIRECTOR"
              ? "bg-blue-100 text-blue-800"
              : employee.employeeRole === "JOINT_DIRECTOR"
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800";

            return (
              <div 
                key={employee.id}
                className={`
                  border-b last:border-b-0 ${borderColor}
                  ${bgColor} relative
                `}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`}></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{employee.user.name}</p>
                      <p className="text-sm text-gray-500">{employee.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
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
    </div>
  );
}