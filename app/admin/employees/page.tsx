import { db } from "@/lib/db";
import { EmployeeRoleSelect } from "@/components/admin/employee-role-select";
import { Card, CardContent } from "@/components/ui/card";
import { Employee, User } from "@prisma/client";

type EmployeeWithUserAndTeam = Employee & {
  user: User;
  memberOfTeam: {
    id: string;
    leader: {
      id: string;
      user: {
        name: string;
        email: string;
      };
    };
  } | null;
};

// Remove caching to ensure fresh data on each request
async function getEmployees() {
  const teams = await db.team.findMany({
    include: {
      leader: {
        include: {
          user: true
        }
      },
      members: {
        include: {
          user: true
        },
        orderBy: {
          employeeRole: 'asc'
        }
      }
    }
  });

  return teams;
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EmployeesPage() {
  const teams = await getEmployees();

  // Helper function to get role-based styles
  const getRoleStyles = (role: string) => {
    switch (role) {
      case "EXECUTIVE_DIRECTOR":
        return {
          bg: "bg-emerald-50 hover:bg-emerald-100 transition-colors",
          border: "border-l-4 border-emerald-500",
          dot: "bg-emerald-500",
          badge: "bg-emerald-100 text-emerald-800",
          line: "border-emerald-200"
        };
      case "DIRECTOR":
        return {
          bg: "bg-sky-50 hover:bg-sky-100 transition-colors",
          border: "border-l-4 border-sky-500",
          dot: "bg-sky-500",
          badge: "bg-sky-100 text-sky-800",
          line: "border-sky-200"
        };
      case "JOINT_DIRECTOR":
        return {
          bg: "bg-violet-50 hover:bg-violet-100 transition-colors",
          border: "border-l-4 border-violet-500",
          dot: "bg-violet-500",
          badge: "bg-violet-100 text-violet-800",
          line: "border-violet-200"
        };
      default:
        return {
          bg: "bg-slate-50 hover:bg-slate-100 transition-colors",
          border: "border-l-4 border-slate-300",
          dot: "bg-slate-400",
          badge: "bg-slate-100 text-slate-800",
          line: "border-slate-200"
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
      </div>

      <div className="space-y-6">
        {teams.map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Team Leader */}
                <div className={`${getRoleStyles("EXECUTIVE_DIRECTOR").bg} ${getRoleStyles("EXECUTIVE_DIRECTOR").border} relative`}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <span className={`w-2 h-2 rounded-full ${getRoleStyles("EXECUTIVE_DIRECTOR").dot}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.leader.user.name}</p>
                        <p className="text-sm text-gray-500">{team.leader.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleStyles("EXECUTIVE_DIRECTOR").badge}`}>
                        EXECUTIVE DIRECTOR
                      </span>
                      <EmployeeRoleSelect
                        employeeId={team.leader.id}
                        currentRole="EXECUTIVE_DIRECTOR"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="pl-8 space-y-4">
                  {team.members.map((member, index) => {
                    const styles = getRoleStyles(member.employeeRole);
                    const isLast = index === team.members.length - 1;

                    return (
                      <div key={member.id} className="relative">
                        {/* Connecting Lines */}
                        <div className="absolute left-0 top-0 -ml-4 h-full border-l border-gray-200" />
                        <div className="absolute left-0 top-1/2 -ml-4 w-4 border-t border-gray-200" />
                        
                        <div className={`${styles.bg} ${styles.border}`}>
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}