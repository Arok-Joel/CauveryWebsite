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

interface Employee {
  id: string;
  name: string;
  leadsTeam?: boolean | null;
}

const createTeamSchema = z.object({
  leaderId: z.string().min(1, 'Team leader is required'),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [executiveDirectors, setExecutiveDirectors] = useState<Employee[]>([]);
  const router = useRouter();

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      leaderId: '',
    },
  });

  const fetchExecutiveDirectors = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/employees/executive-directors');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch executive directors');
      }

      // Only show executive directors who aren't already leading a team
      const availableDirectors = data.executiveDirectors.filter(
        (director: Employee) => !director.leadsTeam
      );

      setExecutiveDirectors(availableDirectors);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch executive directors');
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchExecutiveDirectors();
    }
  };

  const onSubmit = async (data: CreateTeamValues) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }

      toast.success('Team created successfully');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team by selecting an Executive Director as the team leader.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Leader</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team leader" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {executiveDirectors.map(director => (
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
              {isLoading ? 'Creating...' : 'Create Team'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
