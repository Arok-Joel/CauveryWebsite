import { getEmployeeHierarchy } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeNodeComponent } from '@/components/admin/employee-node';
import { EmployeeRole, User } from '@prisma/client';

interface EmployeeNode {
  id: string;
  user: User;
  employeeRole: EmployeeRole;
  hierarchyLevel?: number;
  reportsTo?: string | null;
  children: EmployeeNode[];
}

const roleOrder = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4,
} as const;

async function getEmployees() {
  try {
    const { teams, unassignedEmployees } = await getEmployeeHierarchy();

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
          hierarchyLevel: member.hierarchyLevel,
          children: [],
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

      // Build the hierarchy based on reporting relationships
      // First, check each Field Officer
      fieldOfficers.forEach(fo => {
        if (fo.reportsTo) {
          // Check if reports to a Joint Director
          const reportingJD = jointDirectors.find(jd => fo.reportsTo === jd.id);
          if (reportingJD) {
            reportingJD.children.push(fo);
            return; // Skip to next Field Officer
          }
          
          // Check if reports to a Director (skipping Joint Director)
          const reportingDirector = directors.find(d => fo.reportsTo === d.id);
          if (reportingDirector) {
            reportingDirector.children.push(fo);
            return; // Skip to next Field Officer
          }
        }
        
        // Field Officer with no reporting relationship stays at root level
        // This will be handled later
      });

      // Check each Joint Director
      jointDirectors.forEach(jd => {
        if (jd.reportsTo) {
          // Check if reports to a Director
          const reportingDirector = directors.find(d => jd.reportsTo === d.id);
          if (reportingDirector) {
            reportingDirector.children.push(jd);
            return; // Skip to next Joint Director
          }
          
          // Check if reports directly to Executive Director (not common, but possible)
          if (jd.reportsTo === team.leader.id) {
            // Will be added directly to executive's children later
            return;
          }
        }
        
        // Joint Director with no reporting relationship
        // Will be added directly to executive's children later
      });

      // Get "orphaned" employees (not added to anyone's children yet)
      const orphanedJDs = jointDirectors.filter(jd => 
        !directors.some(d => d.children.some(child => child.id === jd.id))
      );
      
      const orphanedFOs = fieldOfficers.filter(fo => 
        !jointDirectors.some(jd => jd.children.some(child => child.id === fo.id)) &&
        !directors.some(d => d.children.some(child => child.id === fo.id))
      );

      // Add Directors and orphaned employees directly to Executive Director
      return {
        id: team.leader.id,
        user: team.leader.user,
        employeeRole: team.leader.employeeRole,
        children: [
          ...directors, 
          ...orphanedJDs,
          ...orphanedFOs
        ],
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
      hierarchyLevel: emp.hierarchyLevel,
      children: [],
    }));

    // Sort unassigned by role first, then name
    unassigned.sort((a, b) => {
      const roleDiff = roleOrder[a.employeeRole] - roleOrder[b.employeeRole];
      return roleDiff !== 0 ? roleDiff : a.user.name.localeCompare(b.user.name);
    });

    return { executives, unassigned };
  } catch (error) {
    console.error('Error fetching employees:', error);
    // Return empty arrays but log the specific error
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return { executives: [], unassigned: [] };
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EmployeesPage() {
  const { executives, unassigned } = await getEmployees();

  return (
    <div className="space-y-6">
      {/* Executive Directors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Directors & Their Teams</CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-8">
            {executives.map((executive, index) => (
              <EmployeeNodeComponent 
                key={`exec-${executive.id}-${index}`} 
                employee={executive} 
                showTeamBadge={true}
                parentId={`executive-section`}
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
              {unassigned.map((employee, index) => (
                <EmployeeNodeComponent 
                  key={`unassigned-${employee.id}-${index}`} 
                  employee={employee}
                  parentId={`unassigned-section`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
