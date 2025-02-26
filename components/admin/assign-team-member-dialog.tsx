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
import { UserPlus } from 'lucide-react';

const assignMemberSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
});

type AssignMemberValues = z.infer<typeof assignMemberSchema>;

interface AssignTeamMemberDialogProps {
  teamId: string;
  teamName: string;
}

interface Employee {
  id: string;
  user: {
    name: string;
    email: string;
  };
  employeeRole: string;
}

export function AssignTeamMemberDialog({ teamId, teamName }: AssignTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const router = useRouter();

  const form = useForm<AssignMemberValues>({
    resolver: zodResolver(assignMemberSchema),
    defaultValues: {
      employeeId: '',
    },
  });

  // Fetch available employees when dialog opens
  const fetchAvailableEmployees = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching employees for team:', teamId);
      const response = await fetch(`/api/admin/teams/${teamId}/available-employees`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to fetch available employees');
      }

      console.log('Fetched employees:', data.employees?.length || 0);
      setAvailableEmployees(data.employees || []);
    } catch (error) {
      console.error('Error in fetchAvailableEmployees:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch available employees');
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchAvailableEmployees();
    }
  };

  const onSubmit = async (data: AssignMemberValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: data.employeeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign team member');
      }

      toast.success('Team member assigned successfully');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign team member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Add a new member to {teamName}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Employee</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableEmployees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.user.name} - {employee.employeeRole}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
