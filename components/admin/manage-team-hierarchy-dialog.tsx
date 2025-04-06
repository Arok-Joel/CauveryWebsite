'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Network, RefreshCw } from 'lucide-react';

interface TeamMember {
  id: string;
  employeeRole: string;
  reportsToId: string | null;
  hierarchyLevel?: number; // Make optional since it might not be available
  user: {
    name: string;
    email: string;
  };
}

interface ManageTeamHierarchyDialogProps {
  teamId: string;
  teamName: string;
  members: TeamMember[];
}

export function ManageTeamHierarchyDialog({
  teamId,
  teamName,
  members,
}: ManageTeamHierarchyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingLevels, setIsUpdatingLevels] = useState(false);
  const router = useRouter();

  // Add debugging when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Team members:', members);
      console.log('Executive Directors:', executiveDirectors);
      console.log('Directors:', directors);
    }
  }, [open, members]);

  // Group members by role for easier display management
  const executiveDirectors = members.filter(m => m.employeeRole === 'EXECUTIVE_DIRECTOR');
  const directors = members.filter(m => m.employeeRole === 'DIRECTOR');
  const jointDirectors = members.filter(m => m.employeeRole === 'JOINT_DIRECTOR');
  const fieldOfficers = members.filter(m => m.employeeRole === 'FIELD_OFFICER');

  const updateReporting = async (employeeId: string, reportsToId: string | null) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/employees/${employeeId}/reports-to`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportsToId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update reporting structure');
      }

      toast.success('Reporting structure updated');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update reporting structure');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get potential managers for an employee based on hierarchy level or role
  const getPotentialManagersForEmployee = (employee: TeamMember) => {
    // If hierarchyLevel is available, use it
    if (typeof employee.hierarchyLevel === 'number') {
      return members.filter(m => 
        // Different employee
        m.id !== employee.id && 
        // Higher position (lower hierarchy level number)
        typeof m.hierarchyLevel === 'number' && 
        m.hierarchyLevel < (employee.hierarchyLevel as number)
      );
    } 
    // Fallback to role-based filtering if hierarchyLevel is not available
    else {
      const roleHierarchy = {
        'EXECUTIVE_DIRECTOR': 0,
        'DIRECTOR': 1,
        'JOINT_DIRECTOR': 2,
        'FIELD_OFFICER': 3
      };
      
      return members.filter(m => 
        m.id !== employee.id && 
        roleHierarchy[m.employeeRole as keyof typeof roleHierarchy] < 
        roleHierarchy[employee.employeeRole as keyof typeof roleHierarchy]
      );
    }
  };

  // Function to update hierarchy levels
  const updateHierarchyLevels = async () => {
    try {
      setIsUpdatingLevels(true);
      const response = await fetch('/api/admin/update-hierarchy-levels', {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update hierarchy levels');
      }

      const result = await response.json();
      console.log('Hierarchy levels updated:', result);
      
      toast.success(`Updated ${result.updatedCount} of ${result.totalCount} employees`);
      router.refresh();
    } catch (error) {
      console.error('Error updating hierarchy levels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update hierarchy levels');
    } finally {
      setIsUpdatingLevels(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Network className="h-4 w-4 mr-2" />
          Manage Hierarchy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Team Hierarchy</DialogTitle>
          <DialogDescription>
            Set up who reports to whom within Team. Directors report to the Executive Director,
            Joint Directors report to Directors, and Field Officers report to Joint Directors.
          </DialogDescription>
          <p className="mt-2 text-sm text-amber-600">
            Note: With the new flexible hierarchy system, employees can report to anyone with a higher 
            position (lower hierarchy level number), even if they skip a role.
          </p>
        </DialogHeader>

        {/* Debug Info (remove in production) */}
        <div className="text-xs text-gray-500 mb-2">
          Members count: {members.length} | ED: {executiveDirectors.length} | Dir: {directors.length} | JD: {jointDirectors.length} | FO: {fieldOfficers.length}
        </div>

        {/* Improved Debug Info */}
        <div className="my-2 p-2 bg-gray-100 rounded text-xs font-mono">
          <p>Raw Members Data:</p>
          <pre className="overflow-auto max-h-20">
            {JSON.stringify(members.map(m => ({
              id: m.id,
              name: m.user.name,
              role: m.employeeRole,
              level: m.hierarchyLevel
            })), null, 2)}
          </pre>
        </div>

        {/* Check if we have any executive directors */}
        {executiveDirectors.length === 0 && (
          <div className="p-3 mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p className="font-medium">No Executive Director Found</p>
            <p className="text-sm mt-1">
              Try clicking the "Fix Hierarchy Levels" button below to repair the employee hierarchy levels.
              Then refresh the page.
            </p>
          </div>
        )}

        {/* Executive Directors Section */}
        {executiveDirectors.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Executive Directors</h3>
            {executiveDirectors.map(executiveDirector => (
              <div
                key={executiveDirector.id}
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{executiveDirector.user.name}</p>
                  <p className="text-sm text-gray-500">{executiveDirector.user.email}</p>
                  <p className="text-xs text-gray-400">Level: {executiveDirector.hierarchyLevel ?? 'not set'}</p>
                </div>
                <span className="text-sm text-green-700 font-medium">Team Leader</span>
              </div>
            ))}
          </div>
        )}

        {/* Directors Section */}
        {directors.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Directors</h3>
            {directors.map(director => {
              // For Directors, we specifically want them to report to EDs
              const potentialManagers = executiveDirectors.length > 0 ? 
                executiveDirectors : 
                getPotentialManagersForEmployee(director);
              
              return (
                <div
                  key={director.id}
                  className="flex items-center justify-between p-4 bg-sky-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{director.user.name}</p>
                    <p className="text-sm text-gray-500">{director.user.email}</p>
                    <p className="text-xs text-gray-400">Level: {director.hierarchyLevel ?? 'not set'}</p>
                  </div>
                  <Select
                    value={director.reportsToId || ''}
                    onValueChange={value => updateReporting(director.id, value)}
                    disabled={isLoading || potentialManagers.length === 0}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Reports to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {potentialManagers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.user.name} ({manager.employeeRole})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        {/* Joint Directors Section */}
        {jointDirectors.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Joint Directors</h3>
            {jointDirectors.map(jointDirector => {
              const potentialManagers = getPotentialManagersForEmployee(jointDirector);
              
              return (
                <div
                  key={jointDirector.id}
                  className="flex items-center justify-between p-4 bg-violet-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{jointDirector.user.name}</p>
                    <p className="text-sm text-gray-500">{jointDirector.user.email}</p>
                  </div>
                  <Select
                    value={jointDirector.reportsToId || ''}
                    onValueChange={value => updateReporting(jointDirector.id, value)}
                    disabled={isLoading || potentialManagers.length === 0}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Reports to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {potentialManagers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.user.name} ({manager.employeeRole})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        {/* Field Officers Section */}
        {fieldOfficers.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Field Officers</h3>
            {fieldOfficers.map(fieldOfficer => {
              const potentialManagers = getPotentialManagersForEmployee(fieldOfficer);
              
              return (
                <div
                  key={fieldOfficer.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{fieldOfficer.user.name}</p>
                    <p className="text-sm text-gray-500">{fieldOfficer.user.email}</p>
                  </div>
                  <Select
                    value={fieldOfficer.reportsToId || ''}
                    onValueChange={value => updateReporting(fieldOfficer.id, value)}
                    disabled={isLoading || potentialManagers.length === 0}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Reports to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {potentialManagers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.user.name} ({manager.employeeRole})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        {/* Add a DialogFooter with the update hierarchy levels button */}
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={updateHierarchyLevels} 
            disabled={isUpdatingLevels}
            className="ml-auto"
          >
            {isUpdatingLevels ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating Levels...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Fix Hierarchy Levels
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
