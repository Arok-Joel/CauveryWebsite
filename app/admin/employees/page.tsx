import { Suspense } from 'react';
import { getEmployeeHierarchy } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeNodeComponent } from '@/components/admin/employee-node';
import { EmployeeRole, User } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeUser {
  id: string;
  name: string;
  email: string;
}

interface EmployeeNode {
  id: string;
  user: EmployeeUser;
  employeeRole: EmployeeRole;
  hierarchyLevel?: number;
  reportsToId?: string | null;
  children: EmployeeNode[];
  isTeamLeader?: boolean;
}

const roleOrder = {
  EXECUTIVE_DIRECTOR: 1,
  DIRECTOR: 2,
  JOINT_DIRECTOR: 3,
  FIELD_OFFICER: 4,
} as const;

// Loading component for employee nodes
function EmployeeNodeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    </div>
  );
}

async function getEmployees() {
  try {
    const { teams, unassignedEmployees } = await getEmployeeHierarchy();

    // Create nodes for team leaders (executives)
    const executives = teams.map(team => {
      // First, organize team members by role
      const directors: EmployeeNode[] = [];
      const jointDirectors: EmployeeNode[] = [];
      const fieldOfficers: EmployeeNode[] = [];
      const executiveDirectors: EmployeeNode[] = [];

      team.members.forEach(member => {
        const node: EmployeeNode = {
          id: member.id,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email
          },
          employeeRole: member.employeeRole,
          reportsToId: member.reportsToId,
          hierarchyLevel: member.hierarchyLevel,
          children: [],
          isTeamLeader: false
        } as any; // Type assertion to avoid TS conflicts

        switch (member.employeeRole) {
          case 'EXECUTIVE_DIRECTOR':
            executiveDirectors.push(node);
            break;
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
      
      // Add team leader as root node
      const executiveNode: EmployeeNode = {
        id: team.leader.id,
        user: {
          id: team.leader.user.id,
          name: team.leader.user.name,
          email: team.leader.user.email
        },
        employeeRole: team.leader.employeeRole,
        hierarchyLevel: team.leader.hierarchyLevel,
        children: [],
        isTeamLeader: true
      } as any; // Type assertion to avoid TS conflicts

      // Build the hierarchy based on reporting relationships
      // First, check each Field Officer
      fieldOfficers.forEach(fo => {
        if (fo.reportsToId) {
          // Check if reports to a Joint Director
          const reportingJD = jointDirectors.find(jd => fo.reportsToId === jd.id);
          if (reportingJD) {
            reportingJD.children.push(fo);
            return; // Skip to next Field Officer
          }
          
          // Check if reports to a Director (skipping Joint Director)
          const reportingDirector = directors.find(d => fo.reportsToId === d.id);
          if (reportingDirector) {
            reportingDirector.children.push(fo);
            return; // Skip to next Field Officer
          }
          
          // Check if reports to another Executive Director
          const reportingED = executiveDirectors.find(ed => fo.reportsToId === ed.id);
          if (reportingED) {
            reportingED.children.push(fo);
            return; // Skip to next Field Officer
          }
        }
      });

      // Check each Joint Director
      jointDirectors.forEach(jd => {
        if (jd.reportsToId) {
          // Check if reports to a Director
          const reportingDirector = directors.find(d => jd.reportsToId === d.id);
          if (reportingDirector) {
            reportingDirector.children.push(jd);
            return; // Skip to next Joint Director
          }
          
          // Check if reports to another Executive Director
          const reportingED = executiveDirectors.find(ed => jd.reportsToId === ed.id);
          if (reportingED) {
            reportingED.children.push(jd);
            return; // Skip to next Joint Director
          }
          
          // Check if reports directly to Executive Director (team leader)
          if (jd.reportsToId === team.leader.id) {
            return;
          }
        }
      });
      
      // Check each Director
      directors.forEach(director => {
        if (director.reportsToId) {
          // Check if reports to another Executive Director (not team leader)
          const reportingED = executiveDirectors.find(ed => director.reportsToId === ed.id);
          if (reportingED) {
            reportingED.children.push(director);
            return; // Skip this Director since it's now a child of another ED
          }
        }
      });

      // Get "orphaned" employees (those who don't have their manager in the hierarchy)
      const orphanedJDs = jointDirectors.filter(jd => 
        !directors.some(d => d.children.some(child => child.id === jd.id)) &&
        !executiveDirectors.some(ed => ed.children.some(child => child.id === jd.id))
      );
      
      const orphanedFOs = fieldOfficers.filter(fo => 
        !jointDirectors.some(jd => jd.children.some(child => child.id === fo.id)) &&
        !directors.some(d => d.children.some(child => child.id === fo.id)) &&
        !executiveDirectors.some(ed => ed.children.some(child => child.id === fo.id))
      );
      
      const orphanedDirectors = directors.filter(d => 
        !executiveDirectors.some(ed => ed.children.some(child => child.id === d.id))
      );

      // Add Directors and orphaned employees directly to Executive Director
      executiveNode.children = [
        ...executiveDirectors, // Add other EDs as children of the team leader
        ...orphanedDirectors,  // Add Directors that don't report to other EDs
        ...orphanedJDs,
        ...orphanedFOs
      ];
      
      return executiveNode;
    });

    // Create nodes for unassigned employees
    const unassigned = unassignedEmployees.map(emp => ({
      id: emp.id,
      user: {
        id: emp.user.id,
        name: emp.user.name,
        email: emp.user.email
      },
      employeeRole: emp.employeeRole,
      reportsToId: emp.reportsToId,
      hierarchyLevel: emp.hierarchyLevel,
      children: [],
    }) as any); // Type assertion to avoid TS conflicts

    // Sort all levels by name
    const sortByName = (a: EmployeeNode, b: EmployeeNode) => a.user.name.localeCompare(b.user.name);

    executives.sort(sortByName);
    executives.forEach(exec => {
      exec.children.sort(sortByName);
      exec.children.forEach(child => {
        if (child.children) {
          child.children.sort(sortByName);
          child.children.forEach(grandchild => {
            if (grandchild.children) {
              grandchild.children.sort(sortByName);
            }
          });
        }
      });
    });

    // Sort unassigned by role first, then name
    unassigned.sort((a: any, b: any) => {
      const roleOrderA = roleOrder[a.employeeRole as EmployeeRole] || 99;
      const roleOrderB = roleOrder[b.employeeRole as EmployeeRole] || 99;
      const roleDiff = roleOrderA - roleOrderB;
      return roleDiff !== 0 ? roleDiff : a.user.name.localeCompare(b.user.name);
    });

    return { executives, unassigned };
  } catch (error) {
    console.error('Error fetching employees:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return { executives: [], unassigned: [] };
  }
}

async function EmployeeList() {
  const { executives, unassigned } = await getEmployees();

  return (
    <>
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
                employee={executive as any} 
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
                  employee={employee as any}
                  parentId={`unassigned-section`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Remove force-dynamic and revalidate
export const dynamic = 'auto';
export const revalidate = 60; // Cache for 1 minute

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Executive Directors & Their Teams</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                <EmployeeNodeSkeleton />
                <EmployeeNodeSkeleton />
              </div>
            </CardContent>
          </Card>
        </div>
      }>
        <EmployeeList />
      </Suspense>
    </div>
  );
}
