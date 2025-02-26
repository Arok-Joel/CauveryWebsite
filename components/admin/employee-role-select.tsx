'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { EmployeeRole } from '@prisma/client';

interface EmployeeRoleSelectProps {
  employeeId: string;
  currentRole: EmployeeRole;
}

export function EmployeeRoleSelect({ employeeId, currentRole }: EmployeeRoleSelectProps) {
  const router = useRouter();
  const [role, setRole] = useState<EmployeeRole>(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { label: 'Executive Director', value: 'EXECUTIVE_DIRECTOR' },
    { label: 'Director', value: 'DIRECTOR' },
    { label: 'Joint Director', value: 'JOINT_DIRECTOR' },
    { label: 'Field Officer', value: 'FIELD_OFFICER' },
  ] as const;

  async function onRoleChange(newRole: EmployeeRole) {
    if (newRole === role) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/employees/${employeeId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      // Only update the UI state if the request was successful
      setRole(newRole);
      toast.success('Role updated successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
      // Don't update the select value on error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Select value={role} onValueChange={onRoleChange} disabled={isLoading}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map(role => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
