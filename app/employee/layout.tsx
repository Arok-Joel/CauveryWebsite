'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, loading } = useAuth();

  // Protect employee routes
  useEffect(() => {
    if (!loading && (!user || user.role !== 'EMPLOYEE')) {
      router.push('/auth/employee/login');
    }
  }, [user, router, loading]);

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If not authenticated, don't show anything while redirecting
  if (!user || user.role !== 'EMPLOYEE') {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/employee/dashboard',
    },
    {
      name: 'Profile',
      href: '/employee/profile',
    },
    {
      name: 'Announcements',
      href: '/employee/announcements',
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      toast.success('Logged out successfully');
      router.push('/auth/employee/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!user || user.role !== 'EMPLOYEE') {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Employee Portal</h1>
          <p className="text-sm text-gray-400 mt-1">{user.name}</p>
        </div>
        <nav className="mt-8">
          {navigation.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 mx-4 rounded-lg ${
                pathname === item.href
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-100">
        <header className="bg-white shadow">
          <div className="px-4 py-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {navigation.find(item => item.href === pathname)?.name || 'Employee'}
            </h2>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
