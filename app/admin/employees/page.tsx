import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import type { Employee, User } from "@prisma/client";

type EmployeeWithUser = Employee & {
  user: User;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const employees = await db.employee.findMany({
    take: 10,
    orderBy: { dateOfJoining: "desc" },
    include: { user: true }
  });
  return employees as EmployeeWithUser[];
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>
      
      <div className="rounded-md border">
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee: EmployeeWithUser) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.employeeRole}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{employee.guardianName}</td>
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
        </div>
      </div>
    </div>
  );
}