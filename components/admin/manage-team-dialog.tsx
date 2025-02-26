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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Settings, UserMinus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Employee {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  user: {
    name: string;
    email: string;
  };
  employeeRole: string;
}

interface Director {
  id: string;
  name: string;
}

const manageTeamSchema = z.object({
  leaderId: z.string().min(1, 'New team leader is required'),
});

type ManageTeamValues = z.infer<typeof manageTeamSchema>;

interface ManageTeamDialogProps {
  teamId: string;
  currentLeaderId: string;
}

export function ManageTeamDialog({ teamId, currentLeaderId }: ManageTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState<Director[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const router = useRouter();

  const form = useForm<ManageTeamValues>({
    resolver: zodResolver(manageTeamSchema),
    defaultValues: {
      leaderId: '',
    },
  });

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch team members');
      }

      setTeamMembers(data.members || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch team members');
    }
  };

  // Fetch available executive directors when dialog opens
  const fetchAvailableLeaders = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching available leaders for team:', teamId);
      const response = await fetch('/api/admin/employees/executive-directors');
      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to fetch available leaders');
      }

      // Filter out the current leader
      const filteredLeaders = (data.executiveDirectors || []).filter(
        (director: Director) => director.id !== currentLeaderId
      );

      console.log('Fetched leaders:', filteredLeaders.length);
      setAvailableLeaders(filteredLeaders);
    } catch (error) {
      console.error('Error in fetchAvailableLeaders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch available leaders');
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchAvailableLeaders();
      fetchTeamMembers();
    }
  };

  const onSubmit = async (data: ManageTeamValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/teams/${teamId}/leader`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaderId: data.leaderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update team leader');
      }

      toast.success('Team leader updated successfully');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update team leader');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: memberId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove team member');
      }

      toast.success('Team member removed successfully');
      fetchTeamMembers(); // Refresh the members list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove team member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Team</DialogTitle>
          <DialogDescription>Change the team leader or manage team members.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="leaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Team Leader</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new team leader" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLeaders.map(director => (
                          <SelectItem key={director.id} value={director.id}>
                            {director.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Team Leader'}
              </Button>
            </form>
          </Form>

          <div>
            <h3 className="font-medium mb-4">Team Members</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>{member.user.name}</TableCell>
                    <TableCell>{member.employeeRole}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {teamMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No team members
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
