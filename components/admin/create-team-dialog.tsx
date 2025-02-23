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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  leaderId: z.string().min(1, "Team leader is required"),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [executiveDirectors, setExecutiveDirectors] = useState<{ id: string; name: string; }[]>([]);
  const router = useRouter();

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      leaderId: "",
    },
  });

  // Fetch executive directors when dialog opens
  const fetchExecutiveDirectors = async () => {
    try {
      const response = await fetch("/api/admin/employees/executive-directors");
      const data = await response.json();
      setExecutiveDirectors(data.executiveDirectors);
    } catch (error) {
      toast.error("Failed to fetch executive directors");
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      fetchExecutiveDirectors();
    } else {
      form.reset();
    }
  };

  const onSubmit = async (data: CreateTeamValues) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      toast.success("Team created successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team with an Executive Director as the team leader.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter team name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Leader</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an Executive Director" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {executiveDirectors.map((director) => (
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 