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
          <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            We've sent your employee ID to your registered email address.
            <p className="text-xs text-blue-600 mt-1">
              Please check your inbox and spam folder.
            </p>
          </div>
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
