'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Network } from 'lucide-react';

interface TeamMember {
  id: string;
  employeeRole: string;
  reportsToId: string | null;
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
  const router = useRouter();

  // Group members by role for easier management
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
        </DialogHeader>

        {/* Directors Section */}
        {directors.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Directors</h3>
            {directors.map(director => (
              <div
                key={director.id}
                className="flex items-center justify-between p-4 bg-sky-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{director.user.name}</p>
                  <p className="text-sm text-gray-500">{director.user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Joint Directors Section */}
        {jointDirectors.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Joint Directors</h3>
            {jointDirectors.map(jointDirector => (
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
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Reports to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {directors.map(director => (
                      <SelectItem key={director.id} value={director.id}>
                        {director.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {/* Field Officers Section */}
        {fieldOfficers.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Field Officers</h3>
            {fieldOfficers.map(fieldOfficer => (
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
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Reports to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jointDirectors.map(jointDirector => (
                      <SelectItem key={jointDirector.id} value={jointDirector.id}>
                        {jointDirector.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
