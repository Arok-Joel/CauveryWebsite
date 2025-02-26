import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RegistrationSuccessDialogProps {
  open: boolean;
  employeeId: string;
  onOpenChange: (open: boolean) => void;
}

export function RegistrationSuccessDialog({
  open,
  employeeId,
  onOpenChange,
}: RegistrationSuccessDialogProps) {
  const router = useRouter();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Registration Successful!</AlertDialogTitle>
          <AlertDialogDescription>
            Welcome to Royal Cauvery Farms
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4 text-center">
          <p className="text-sm text-gray-500">
            Your registration is complete. Please save your employee ID:
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-mono font-semibold text-green-700">
              {employeeId}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            You will need this ID to log in to your account.
          </p>
        </div>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={() => router.push("/auth/employee/login")}
          >
            Go to Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
