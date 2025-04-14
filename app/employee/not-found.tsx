'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { UserX } from 'lucide-react';

export default function EmployeeNotFound() {
  const { user } = useAuth();
  const [accountStatus, setAccountStatus] = useState<'loading' | 'terminated' | 'not-found'>('loading');

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setAccountStatus('not-found');
        return;
      }

      try {
        // Check if this is a terminated employee
        const response = await fetch('/api/employee/profile', {
          credentials: 'include',
        });

        if (response.status === 401) {
          setAccountStatus('terminated');
        } else {
          setAccountStatus('not-found');
        }
      } catch (error) {
        setAccountStatus('not-found');
      }
    };

    checkStatus();
  }, [user]);

  if (accountStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center p-8 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-[#3C5A3E]"></div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Checking account status...</h1>
        </div>
      </div>
    );
  }

  if (accountStatus === 'terminated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center p-8 text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <UserX className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Account Terminated</h1>
          <p className="mt-4 text-gray-600">
            Your employee account has been terminated. If you believe this is an error, please contact administration.
          </p>
          <Button 
            className="mt-6 bg-[#3C5A3E] hover:bg-[#2A3F2B]" 
            asChild
          >
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="mt-2 text-gray-600">
          The page you are looking for does not exist.
        </p>
        <Button 
          className="mt-6 bg-[#3C5A3E] hover:bg-[#2A3F2B]" 
          asChild
        >
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>
    </div>
  );
} 