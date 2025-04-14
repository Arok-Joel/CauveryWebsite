'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserMinus } from "lucide-react";
import { EmployeeTerminationButton } from "@/components/admin/employee-termination-button";
import { EmployeeSoldPlots } from "@/app/components/employee/EmployeeSoldPlots";

interface PageClientProps {
  employeeId: string;
  employeeName: string;
  commissions: any[];
}

export default function EmployeePageClient({ employeeId, employeeName, commissions }: PageClientProps) {
  return (
    <>
      {/* Sold Plots Information */}
      <EmployeeSoldPlots 
        initialCommissions={commissions} 
        employeeId={employeeId}
        employeeName={employeeName}
      />
      
      {/* Termination Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Employee Termination</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you need to terminate this employee, use the button below. 
            This will remove the employee from the organization structure and reassign their subordinates to their superior.
          </p>
          <EmployeeTerminationButton 
            employeeId={employeeId}
            employeeName={employeeName}
          />
        </CardContent>
      </Card>
    </>
  );
} 