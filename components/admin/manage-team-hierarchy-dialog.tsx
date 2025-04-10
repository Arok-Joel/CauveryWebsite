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
import { Network, RefreshCw, Loader2 } from 'lucide-react';

interface TeamMember {
  id: string;
  employeeRole: string;
  reportsToId: string | null;
  hierarchyLevel?: number; // Make optional since it might not be available
  user: {
    name: string;
    email: string;
  };
  isTeamLeader?: boolean;
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
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);
  const router = useRouter();

  // Fetch full team data when dialog opens
  useEffect(() => {
    const fetchTeamWithLeader = async () => {
      if (open) {
        try {
          setIsLoadingTeamData(true);
          const response = await fetch(`/api/admin/teams/${teamId}`);
          if (response.ok) {
            const data = await response.json();
            
            // Ensure we have the team leader at the top
            let allTeamMembers: TeamMember[] = [];
            
            // Start with the official team leader
            if (data.leader) {
              allTeamMembers.push({
                id: data.leader.id,
                employeeRole: data.leader.employeeRole || 'EXECUTIVE_DIRECTOR', // Ensure it's EXECUTIVE_DIRECTOR
                reportsToId: null,
                hierarchyLevel: 0, // Executive Director is highest level (0)
                user: {
                  name: data.leader.user.name,
                  email: data.leader.user.email
                },
                isTeamLeader: true // Mark as the official team leader
              });
            }
            
            // Add other members, ensuring no duplication
            const membersToAdd = members.filter(member => 
              !allTeamMembers.some(m => m.id === member.id)
            );
            
            allTeamMembers = [
              ...allTeamMembers,
              ...membersToAdd
            ];
            
            setTeamData(allTeamMembers);
            console.log('Team with leader:', allTeamMembers);
          }
        } catch (error) {
          console.error('Error fetching team data:', error);
          toast.error('Failed to load team data');
        } finally {
          setIsLoadingTeamData(false);
        }
      }
    };
    
    fetchTeamWithLeader();
  }, [open, teamId, members]);

  // Group members by role for easier display management
  const executiveDirectors = teamData.filter(m => m.employeeRole === 'EXECUTIVE_DIRECTOR');
  const directors = teamData.filter(m => m.employeeRole === 'DIRECTOR');
  const jointDirectors = teamData.filter(m => m.employeeRole === 'JOINT_DIRECTOR');
  const fieldOfficers = teamData.filter(m => m.employeeRole === 'FIELD_OFFICER');

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
      return teamData.filter(m => 
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
      
      return teamData.filter(m => 
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
        <Button variant="outline" size="sm" className="flex items-center gap-1 h-9 px-3 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:text-purple-700">
          <Network className="h-4 w-4" />
          <span className="hidden sm:inline">Hierarchy</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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

        {isLoadingTeamData ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading team hierarchy...</p>
          </div>
        ) : (
          <div className="overflow-y-auto pr-3 flex-grow custom-scrollbar">
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
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-sm bg-green-50 p-2 rounded-md">Executive Directors</h3>
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-3">
                  {executiveDirectors.map((executiveDirector, index) => (
                    <div
                      key={`${executiveDirector.id}-${index}`}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 ${
                        executiveDirector.isTeamLeader 
                          ? 'bg-green-100 border border-green-300' 
                          : 'bg-green-50'
                      } rounded-lg`}
                    >
                      <div className="mb-2 sm:mb-0">
                        <p className="font-medium text-sm">{executiveDirector.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{executiveDirector.user.email}</p>
                        <p className="text-xs text-gray-400">Level: {executiveDirector.hierarchyLevel ?? 'not set'}</p>
                      </div>
                      {executiveDirector.isTeamLeader && (
                        <span className="text-xs sm:text-sm text-green-700 font-medium px-2 py-1 bg-green-50 rounded-full">Team Leader</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directors Section */}
            {directors.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-sm bg-blue-50 p-2 rounded-md">Directors</h3>
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                  {directors.map(director => {
                    // For Directors, we specifically want them to report to EDs
                    const potentialManagers = executiveDirectors.length > 0 ? 
                      executiveDirectors : 
                      getPotentialManagersForEmployee(director);
                    
                    return (
                      <div
                        key={director.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-sky-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{director.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{director.user.email}</p>
                          <p className="text-xs text-gray-400">Level: {director.hierarchyLevel ?? 'not set'}</p>
                        </div>
                        <Select
                          value={director.reportsToId || ''}
                          onValueChange={value => updateReporting(director.id, value)}
                          disabled={isLoading || potentialManagers.length === 0}
                        >
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Reports to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {potentialManagers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Joint Directors Section */}
            {jointDirectors.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-sm bg-purple-50 p-2 rounded-md">Joint Directors</h3>
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                  {jointDirectors.map(jointDirector => {
                    const potentialManagers = getPotentialManagersForEmployee(jointDirector);
                    
                    return (
                      <div
                        key={jointDirector.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-violet-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{jointDirector.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{jointDirector.user.email}</p>
                          <p className="text-xs text-gray-400">Level: {jointDirector.hierarchyLevel ?? 'not set'}</p>
                        </div>
                        <Select
                          value={jointDirector.reportsToId || ''}
                          onValueChange={value => updateReporting(jointDirector.id, value)}
                          disabled={isLoading || potentialManagers.length === 0}
                        >
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Reports to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {potentialManagers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Field Officers Section */}
            {fieldOfficers.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-sm bg-orange-50 p-2 rounded-md">Field Officers</h3>
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                  {fieldOfficers.map(fieldOfficer => {
                    const potentialManagers = getPotentialManagersForEmployee(fieldOfficer);
                    
                    return (
                      <div
                        key={fieldOfficer.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-orange-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{fieldOfficer.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{fieldOfficer.user.email}</p>
                          <p className="text-xs text-gray-400">Level: {fieldOfficer.hierarchyLevel ?? 'not set'}</p>
                        </div>
                        <Select
                          value={fieldOfficer.reportsToId || ''}
                          onValueChange={value => updateReporting(fieldOfficer.id, value)}
                          disabled={isLoading || potentialManagers.length === 0}
                        >
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Reports to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {potentialManagers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add a DialogFooter with the update hierarchy levels button */}
        <DialogFooter className="mt-4 flex-shrink-0 border-t pt-4">
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
