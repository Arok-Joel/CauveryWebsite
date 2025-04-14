'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { UserMinus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmployeeTerminationButtonProps {
  employeeId: string;
  employeeName: string;
}

export function EmployeeTerminationButton({ employeeId, employeeName }: EmployeeTerminationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleTermination = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/employees/${employeeId}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to terminate employee');
      }

      toast.success(`${employeeName} has been terminated successfully`);
      setIsOpen(false);
      
      // Redirect to the employees page
      setTimeout(() => {
        router.push('/admin/employees');
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error('Error terminating employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to terminate employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <UserMinus className="h-4 w-4" />
          Terminate Employee
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate {employeeName}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to terminate this employee? This action cannot be undone.
            <br /><br />
            <strong>Note:</strong> All subordinates of this employee will be reassigned to their superior.
            The employee will be removed from teams and hierarchies, and will no longer be able to log in to the system.
            A termination notice will be sent to their email address.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleTermination();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Terminating...
              </>
            ) : (
              'Terminate Employee'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 