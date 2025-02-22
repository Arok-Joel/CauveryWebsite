"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { EmployeeRole } from "@prisma/client"

interface EmployeeRoleSelectProps {
  employeeId: string
  currentRole: EmployeeRole
}

export function EmployeeRoleSelect({
  employeeId,
  currentRole,
}: EmployeeRoleSelectProps) {
  const router = useRouter()
  const [role, setRole] = useState<EmployeeRole>(currentRole)
  const [isLoading, setIsLoading] = useState(false)

  const roles = [
    { label: "Executive Director", value: "EXECUTIVE_DIRECTOR" },
    { label: "Director", value: "DIRECTOR" },
    { label: "Joint Director", value: "JOINT_DIRECTOR" },
    { label: "Field Officer", value: "FIELD_OFFICER" },
  ] as const

  async function onRoleChange(newRole: EmployeeRole) {
    // Optimistically update the UI
    setRole(newRole)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update role")
      }

      toast.success("Role updated successfully")
      // Still refresh to ensure consistency with server
      router.refresh()
    } catch (error) {
      toast.error("Failed to update role")
      // Revert to previous role on error
      setRole(currentRole)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Select
      value={role}
      onValueChange={onRoleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}