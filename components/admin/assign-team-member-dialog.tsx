"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const assignMemberSchema = z.object({
  employeeIds: z.array(z.string()).min(1, "Select at least one employee"),
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
      employeeIds: [],
    },
  });

  // Fetch available employees when dialog opens
  const fetchAvailableEmployees = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching employees for team:", teamId);
      const response = await fetch(`/api/admin/teams/${teamId}/available-employees`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || "Failed to fetch available employees");
      }
      
      console.log("Fetched employees:", data.employees?.length || 0);
      setAvailableEmployees(data.employees || []);
    } catch (error) {
      console.error("Error in fetchAvailableEmployees:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch available employees");
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchAvailableEmployees();
      form.reset({ employeeIds: [] });
    }
  };

  const onSubmit = async (data: AssignMemberValues) => {
    try {
      setIsLoading(true);
      
      // Process each selected employee
      const results = await Promise.all(
        data.employeeIds.map(async (employeeId) => {
          const response = await fetch(`/api/admin/teams/${teamId}/members`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ employeeId }),
          });
          
          return { 
            employeeId, 
            success: response.ok 
          };
        })
      );
      
      const failures = results.filter(r => !r.success);
      
      if (failures.length === 0) {
        toast.success(`${data.employeeIds.length} team member(s) assigned successfully`);
      } else if (failures.length < data.employeeIds.length) {
        toast.warning(`${data.employeeIds.length - failures.length} of ${data.employeeIds.length} members assigned successfully`);
      } else {
        toast.error("Failed to assign team members");
      }
      
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign team members");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
          <DialogDescription>
            Select multiple members to add to {teamName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeIds"
              render={() => (
                <FormItem>
                  <FormLabel>Select Employees</FormLabel>
                  <FormMessage />
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {availableEmployees.length > 0 ? (
                      <div className="space-y-2">
                        {availableEmployees.map((employee) => (
                          <FormField
                            key={employee.id}
                            control={form.control}
                            name="employeeIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={employee.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(employee.id)}
                                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                                        const currentValues = [...(field.value || [])];
                                        if (checked === true) {
                                          field.onChange([...currentValues, employee.id]);
                                        } else {
                                          field.onChange(
                                            currentValues.filter((value) => value !== employee.id)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                      {employee.user.name}
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                      {employee.employeeRole.replace(/_/g, " ")} - {employee.user.email}
                                    </p>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">
                          {isLoading ? "Loading employees..." : "No available employees found"}
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Selected Members"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 